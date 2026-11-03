# Design

## Context

Ver `proposal.md - Why` para a motivação. O estado atual relevante:

- `src/casl/casl-ability/casl-ability.service.ts` já contém `can('create', 'pessoa')` no bloco `SECRETARIA_CNC` (alteração local ainda não commitada). `PessoaService.create` valida `this.validateCreateAbility('pessoa')` antes de chamar a API externa e persistir.
- `PessoaService.update` **não** chama `validateUpdateAbility('pessoa')`; o `PATCH /pessoa/:id` atual não verifica permissão no serviço.
- `test/pessoa/pessoa-create.e2e-spec.ts` já cobre 401 (sem token), 403 (`ronaldinho@admin.com`, perfil `NAO_IDENTIFICADO`) e 201 (ADMIN), mockando `SaoPedroPessoaService` por meio do objeto compartilhado `mockSaoPedroPessoaService`.
- O seed (`prisma/seed.ts`) cria `secretaria@admin.com` com role `SECRETARIA_CNC`, senha `admin` e vínculo com a primeira paróquia. `npm run test:e2e` executa `prisma migrate reset --force` + seed antes da suíte.
- `POST /pessoa` retorna a pessoa serializada por `serializePessoaResponse`, combinando o registro local (`id`, `ativo`, `situacaoReligiosa`) com os dados externos (`externalId`, `nome`, `cpf`, etc.).
- `POST /pessoa/:id/contato` reutiliza a mesma permissão `create` sobre `pessoa` (`ContatoService` chama `validateCreateAbility('pessoa')`).

## Goals / Non-Goals

**Goals:**
- Provar por teste unitário e e2e que `SECRETARIA_CNC` consegue criar e atualizar pessoa.
- Garantir que o `PATCH /pessoa/:id` passe a exigir permissão de update, rejeitando perfis sem permissão com 403.
- Manter a prova de que perfis sem permissão continuam recebendo 403 e que requisições sem token continuam recebendo 401.
- Isolar os testes de colisões de `externalId`/CPF entre casos e entre suítes.

**Non-Goals:**
- Restringir o cadastro ou a atualização de pessoa por paróquia (a permissão é global).
- Alterar o contrato de `POST /pessoa`/`PATCH /pessoa/:id` ou o fluxo de criação/atualização.
- Criar uma permissão CASL separada para contato (`pessoaContato` não faz parte de `PermissionResource`).
- Criar nova suíte e2e dedicada; a cobertura é adicionada à suíte existente da rota.

## Decisions

### 1. Estender `test/pessoa/pessoa-create.e2e-spec.ts`

A suíte já concentra os cenários de `POST /pessoa` e possui o setup de mocks da API São Pedro. Adicionar os casos ali evita duplicar `beforeAll`, login e overrides de provider.
- *Alternativa considerada:* novo arquivo `pessoa-create-secretaria-cnc.e2e-spec.ts`. Rejeitada por fragmentar a cobertura da mesma rota e repetir setup.

### 2. Usar o usuário de seed `secretaria@admin.com` para o caso principal

O seed já garante role `SECRETARIA_CNC`, senha `admin` e vínculo de paróquia, e o login é feito no `beforeAll` da suíte (armazenado em `tokenSecretariaCnc`).
- Para o cenário "sem paróquia", criar um usuário adicional no `beforeAll` via `PrismaService.upsert` (mesmo padrão de `test/comunidade.e2e-spec.ts`), sem vínculos em `usuarioParoquia`, e autenticá-lo.
- *Alternativa considerada:* criar os dois usuários no teste. Rejeitada por duplicar o seed e aumentar o custo de setup; o seed existente é a fonte canônica.

### 3. Isolar mocks por caso de sucesso

`mockSaoPedroPessoaService` é um objeto compartilhado e `spyOn` persiste entre casos. Cada caso de sucesso deve:
1. `vi.spyOn(mockSaoPedroPessoaService, 'getExternalPessoaByCpf').mockResolvedValueOnce(null)` para não disparar 409 de CPF.
2. `vi.spyOn(mockSaoPedroPessoaService, 'createExternalPessoa').mockResolvedValueOnce({ ... externalId: 'e2e-pessoa-secretaria-<timestamp>' })` com `externalId` único.

Sem isso, o segundo caso reutiliza o `externalId` do primeiro (o mock com `mockResolvedValue` fixo é calculado uma única vez), e o `@unique` de `pessoa.externalId` falha silenciosamente no catch do serviço, impedindo o 201.
- *Alternativa considerada:* limpar a tabela `pessoa` entre casos. Rejeitada por acoplar o teste ao banco e não ser o padrão das demais suítes.

### 4. Permissão de criação sem escopo de paróquia

Manter a regra como `can('create', 'pessoa')`, sem condição de `usuarioParoquia`. Pessoa não pertence a paróquia e a permissão foi solicitada dessa forma; adicionar escopo exigiria uma relação que não existe no modelo e mudaria o comportamento além do pedido.
- *Alternativa considerada:* condicionar por paróquia do usuário. Rejeitada por não haver vínculo direto pessoa→paróquia e por contrariar a permissão já adicionada.

### 5. Asserção unitária da ability

Adicionar caso em `src/casl/casl-ability/casl-ability.service.spec.ts` verificando `can('create', 'pessoa')` e `can('update', 'pessoa')` para `SECRETARIA_CNC` e as negativas para `NAO_IDENTIFICADO`. É a forma mais barata de falhar cedo se as regras forem removidas, antes mesmo do e2e.

### 6. Aplicar `validateUpdateAbility('pessoa')` no serviço

Adicionar `this.validateUpdateAbility('pessoa')` como primeira instrução de `PessoaService.update`. Sem isso, a regra CASL `can('update', 'pessoa')` não teria efeito no endpoint, pois o fluxo atual não consulta a ability; o teste e2e de sucesso passaria mesmo sem autorização real.
- *Alternativa considerada:* depender apenas do `AuthGuard`/`RoleGuard`. Rejeitada porque o controller não declara `@RequiredRoles` e a autorização fina do projeto é feita via CASL nos serviços.
- Consequência aceita: usuários autenticados de outros perfis passam a receber 403 no `PATCH /pessoa/:id` (antes a rota não validava permissão). O comportamento é o esperado pela spec e coberto por teste.

### 7. Fixture de pessoa para os testes de atualização

A suíte já cria pessoas nos casos de sucesso de `POST`. Para o `PATCH`, criar uma pessoa em `beforeAll` como `ADMIN`, com `externalId` único (respeitando `VarChar(36)`, ex.: `e2e-pessoa-upd-<timestamp>`) e guardar o `id` em uma variável da suíte. Também substituir `SaoPedroContatoService` por `mockSaoPedroContatoService` no `setupTestModule`, para que `findOne` (chamado por `update`) não tente acessar a API externa de contatos.
- *Alternativa considerada:* reutilizar o `id` criado no caso de sucesso de `POST`. Rejeitada por acoplar os testes à ordem de execução.

## Risks / Trade-offs

- **Efeito colateral em contatos** → Como `POST /pessoa/:id/contato` usa `create` sobre `pessoa`, o `SECRETARIA_CNC` passa a poder criar contatos. Aceito e documentado no proposal; o caso 403 existente da suíte de contato usa `ronaldinho@admin.com`, portanto continua válido.
- **Estado compartilhado dos mocks entre suítes** → Cada caso de sucesso define seus próprios `mockResolvedValueOnce` e um `externalId` distinto; se necessário, chamar `vi.clearAllMocks()` no `beforeEach` sem remover os spies de `createExternalPessoa`.
- **Dependência do seed** → O caso principal depende de `secretaria@admin.com`; se o seed mudar, o teste falha no login. Mitigação: a suíte já depende de `admin@admin.com` e `ronaldinho@admin.com` do mesmo seed, então a dependência é consistente com o restante do projeto.
- **Ordem de execução** → A suíte pessoa-contato cria uma pessoa antes de pessoa-create; os CPFs são mockados e o `externalId` é único por caso, então não há colisão.
- **Mudança de comportamento no PATCH** → Antes, qualquer usuário autenticado podia atualizar pessoa; agora apenas `ADMIN` e `SECRETARIA_CNC`. Mitigação: a mudança está na spec/proposal e é coberta por e2e (200 para permitidos, 403 para os demais).
- **Fixtures de atualização** → `PessoaService.update` chama `findOne`, que busca contatos na API São Pedro. Mitigação: substituir `SaoPedroContatoService` pelo mock da suíte para evitar rede e manter o teste determinístico.

## Migration Plan

- Nenhuma migração de banco ou mudança de contrato.
- Rollback: remover os testes adicionados, as linhas `can('create'|'update', 'pessoa')` e a chamada `validateUpdateAbility('pessoa')`; nenhum dado é alterado.

## Open Questions

Nenhuma — a permissão global, o usuário de seed e a extensão da suíte existente foram definidos a partir do código e do pedido.
