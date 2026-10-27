# Design

## Context

- O `SaoPedroPessoaService` (`src/external/sao-pedro/sao-pedro-pessoa.service.ts`) centraliza o padrão de chamadas autenticadas à São Pedro via `executeAuthenticatedRequest` (token válido + retry em 401), usando `SaoPedroAuthService` (login/refresh) e `HttpService`. Rotas atuais usam `/api/pessoas/`.
- O `ContatoService` (`src/pessoa/contato/contato.service.ts`) hoje persiste localmente em `pessoaContato` (transação Prisma com swap do principal) e valida a personagem com `validateCreateAbility('pessoa')`.
- A pessoa local (`pessoa.externalId`) guarda o `uuid` da São Pedro; `POST /pessoa/:id/contato` recebe o **id local**, então o serviço precisa resolver `pessoa → externalId` antes de chamar a São Pedro.
- O modelo da São Pedro (`Contato`) tem `tipo_telefone` (CELULAR/RESIDENCIAL/COMERCIAL), `telefone`, `email`, `observacao` e `contato_principal` (default `true`), vinculado à `Pessoa` — motivação em proposal.md.
- A lib `neocatecumenal` (atualizada) exporta a interface `PessoaContato` (`id`, `pessoaId`, `tipoTelefone`, `telefone`, `email?`, `observacao?`, `contatoPrincipal`), que tipa o contato na representação da API local — e `Pessoa.contatos?: PessoaContato[]`.
- O contrato JSON da API São Pedro é camelCase (o mapeamento e a leitura de pessoas usam `conhecidoPor`, `dataNascimento`, `situacaoReligiosa`, `uuid`, etc.), apesar de o modelo Django usar snake_case internamente.
- Decisões do usuário: rota `POST /api/pessoas/{uuid}/contatos/`; a regra do contato principal único fica a cargo da São Pedro; `contatoPrincipal` ausente não é enviado (default da São Pedro = `true`).

## Goals / Non-Goals

**Goals:**
- Enviar a criação de contato à São Pedro sem gravar no banco local; eliminar a tabela `pessoaContato`.
- Preservar os contratos existentes da rota que permanecem: autenticação/autorização (`create pessoa`), 404 para pessoa local inexistente e 400 para payload inválido.
- Reaproveitar o padrão existente de chamada autenticada à São Pedro sem duplicar o fluxo de token/retry.
- Tipar o contato criado com a interface `PessoaContato` da lib `neocatecumenal`.

**Non-Goals:**
- Rotas GET/PATCH/DELETE de contato e criação em lote (fora do escopo da mudança).
- Migração dos contatos já gravados na `pessoaContato` para a São Pedro.
- Alterar a autorização CASL ou adicionar recurso `pessoaContato`.

## Decisions

### 1. Novo `SaoPedroContatoService` em `src/external/sao-pedro/sao-pedro-contato.service.ts`

Classe `@Injectable()` herdando `BaseService` (padrão dos serviços locais), com `HttpService` e `SaoPedroAuthService` injetados, expondo `createExternalContato(pessoaUuid: string, dto: CreatePessoaContatoDto): Promise<PessoaContato>` que faz `POST ${SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/` e retorna `response.data` tipado como `PessoaContato` (interface da lib `neocatecumenal` — o JSON da São Pedro já chega camelCase, sem transformação adicional).
- *Alternativa considerada:* chamar direto do `ContatoService`. Rejeitada para manter o isolamento entre o domínio `pessoa` e o cliente externo, seguindo o padrão de `SaoPedroPessoaService`.
- O `SaoPedroModule` passa a prover e exportar esse serviço; o `ContatoService` o injeta (o `PessoaModule` já importa `SaoPedroModule`).

### 2. Compartilhar a chamada autenticada em vez de duplicar

Mover `executeAuthenticatedRequest<T>(requestFn, operation)` de `SaoPedroPessoaService` para `SaoPedroAuthService` (que já detém token, `HttpService` e logging), e atualizar `SaoPedroPessoaService` para usá-lo via `this.authService.executeAuthenticatedRequest(...)`. O `SaoPedroContatoService` usa o mesmo método.
- *Alternativa considerada:* copiar o método privado no novo serviço. Rejeitada: duplicaria token/retry/tratamento de erro em dois lugares.
- Refatoração pequena e comportamentalmente neutra (o método continua privado no módulo externo, exposto só via `authService`).

### 3. Novo payload do `CreatePessoaContatoDto`

Campos, todos opcionais (`class-validator`, padrão do projeto):
- `tipoTelefone` — `@IsOptional()` + `@IsEnum(TPO...)` com valores `CELULAR | RESIDENCIAL | COMERCIAL` (mesma escrita dos choices da São Pedro, porém camelCase na API local).
- `telefone` — `@IsOptional()` + `@IsString()` + `@MaxLength(20)` (alinhado a `CharField(max_length=20)` da São Pedro).
- `email` — `@IsOptional()` + `@IsEmail()`.
- `observacao` — `@IsOptional()` + `@IsString()`.
- `contatoPrincipal` — `@IsOptional()` + `@IsBoolean()`.
- Removidos: `telefoneResidencial`, `telefoneCelular` e `ativo` — não existem no modelo da São Pedro.

### 4. Mapper `create-contato.mapper.ts`

`CreateContatoMapper.toExternal(dto)` retorna o payload em camelCase — `{ tipoTelefone, telefone, email, observacao, contatoPrincipal }` — omitindo campos `undefined`. `contatoPrincipal` ausente ⇒ campo não enviado ⇒ default da São Pedro (`true`). O contrato camelCase segue o padrão já usado pelo `CreatePessoaMapper` (a API São Pedro aceita camelCase no JSON, apesar do snake_case interno do Django).

### 5. Fluxo do `ContatoService.create(pessoaId, dto)`

1. `this.validateCreateAbility('pessoa')` (mantido).
2. `this.prisma.pessoa.findUniqueOrThrow({ where: { id: pessoaId }, select: { externalId: true } })` — resolve o uuid local; pessoa inexistente propaga P2025 → 404 `O registro de 'Pessoa' não foi encontrado.` pelo `PrismaExceptionsFilter` (mesmo comportamento atual, sem trocar nada).
3. `this.saoPedroContatoService.createExternalContato(pessoa.externalId, dto)`.
4. Retorna o contato criado (resposta da São Pedro).
- **Removido**: a transação Prisma e o `updateMany` de swap — a São Pedro garante a regra do principal único (decisão do usuário).
- *Alternativa considerada:* manter `ativo`/swap local. Rejeitada conforme os answers do usuário (`ativo` não existe no modelo; a São Pedro garante a regra).

### 6. Resposta da rota

A rota retorna o contato criado pela São Pedro, tipado como `PessoaContato` (`response.data`), a forma de contato definida na lib `neocatecumenal`. Diferente do padrão das pessoas, não há transformação `uuid → externalId` no contato: o JSON externo já corresponde à interface, então o retorno é direto e tipado.

### 7. Remoção da tabela `pessoaContato`

- Remover o modelo `pessoaContato` e a relação `contatos` de `pessoa` em `prisma/schema.prisma`.
- Gerar migração Prisma que faz `DROP TABLE "pessoaContato"` (sem reverter dados: os contatos locais não são migrados — escopo).
- Atualizar `src/pessoa/contato/contato.service.ts` (deixa de usar `tx.pessoaContato`), `contato.service.spec.ts`, `pessoa.controller.spec.ts`, `test/pessoa/pessoa-contato.e2e-spec.ts` (deixa de consultar `prisma.pessoaContato`) e o mock `test/mocks/sao-pedro-api-mock.ts` (novo método `createExternalContato`).
- Verificado: nenhum outro arquivo em `src/` referencia `pessoaContato`/`contatos` (includes/selects/serializers não usam a relação).

## Risks / Trade-offs

- **Resposta externa baseada em interface da lib** → O contrato do `PessoaContato` criado assume que `response.data` da São Pedro corresponde à interface `PessoaContato` da lib. Mitigação: o retorno é tipado como ela e o mock/e2e usam a mesma forma; se a São Pedro divergir (ex.: campos aninhados), o ajuste é pontual no retorno do `SaoPedroContatoService` e no mock.
- **Falha da API externa** → Criação falha se a São Pedro estiver fora; `executeAuthenticatedRequest` propaga `HttpException` com o status da resposta. Mitigação: mesmo comportamento já adotado para pessoas (`createExternalPessoa`). Registrar/alertar não é escopo.
- **Perda de dados da tabela local** → O drop da tabela descarta contatos antigos sem réplica. Trade-off aceito e fora do escopo (declarado na proposal); rollback via restore do banco se necessário.
- **Regra do principal único dependente da São Pedro** → Se a São Pedro não rebaixar o principal anterior, a invariante deixa de valer. Decisão explícita do usuário; cenário coberto por e2e com mock que simula o rebaixamento.
- **Refatoração do `executeAuthenticatedRequest`** → Risco baixo, mas mexe em serviço de produção. Mitigação: mudança apenas de local (método movido para `SaoPedroAuthService`), sem alterar o corpo; a suíte e2e de pessoas já exercita o caminho.

## Migration Plan

- Nova migração Prisma: `DROP TABLE "pessoaContato"` (nome sugerido: `drop_pessoa_contato`). Rodar `prisma migrate dev` localmente e validar o SQL antes de aplicar.
- Deploy: subir a migração antes ou junto do código que deixa de usar a tabela (a ordem de rollout não é crítica — a tabela não é mais lida); em seguida publicar o código.
## Rollback

- Rollback: reverter o commit da migração e recriar a tabela a partir da migração anterior; a feature antiga volta a operar sobre `pessoaContato` (dados novos permanecem na São Pedro — possível duplicação temporária, aceita).