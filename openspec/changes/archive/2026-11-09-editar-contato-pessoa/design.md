# Design

## Context

- O `PessoaController` (`src/pessoa/pessoa.controller.ts`) usa `@Controller('pessoa')` e já agrupa as operações de pessoa e de seus sub-recursos (ex.: casal). A criação de contato `POST /pessoa/:id/contato` (`createContato`) vive aqui, delegando ao `ContatoService` com o id local da pessoa.
- Decisão do usuário (após a proposta original): as rotas de contato permanecem no `PessoaController`, seguindo sempre o padrão `pessoa/{id}/contato/{...}` para criação e edição — não haverá controller separado na pasta `contato` nem movimentação da rota de criação. Ver proposal.md.
- O `ContatoService` (`src/pessoa/contato/contato.service.ts`) já existe: `create(pessoaId, dto)` valida `create pessoa` via CASL, resolve a pessoa local para `externalId` (`findUniqueOrThrow`) e delega à São Pedro. Nenhum contato é persistido localmente.
- O `SaoPedroContatoService` (`src/external/sao-pedro/sao-pedro-contato.service.ts`) centraliza as chamadas autenticadas à São Pedro via `authService.executeAuthenticatedRequest` (token + retry 401). A criação é `POST ${SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/`; a atualização é `PATCH ${SAO_PEDRO_API_URL}/api/contatos/${contatoId}/` (somente o id do contato). A resposta é convertida de snake_case para camelCase por `ContatoResponseMapper.toDomain` (interface `PessoaContato`).
- O payload externo é snake_case via `CreateContatoMapper.toExternal` (omite campos `undefined`; `contatoPrincipal` ausente não é enviado — default `true` da São Pedro). O id do contato na São Pedro é o campo `id` da resposta (`PessoaContato.id`).
- O contrato HTTP local de contatos é camelCase; a rota `POST /pessoa/:id/contato` mantém path, payload e resposta atuais.

## Goals / Non-Goals

**Goals:**
- Adicionar `PATCH /pessoa/:id/contato/:contatoId` (id do contato = id da API externa São Pedro) no `PessoaController`, mantendo o padrão aninhado `pessoa/{id}/contato/{...}` junto da criação.
- Delegar a atualização à São Pedro com o mesmo padrão de autorização/erros das demais rotas, reutilizando `executeAuthenticatedRequest`, `CreateContatoMapper` e `ContatoResponseMapper`.
- Não mover a rota de criação nem criar controller novo — o `PessoaController` continua dono das rotas de contato.

**Non-Goals:**
- Rotas de exclusão (DELETE) ou listagem dedicada (`GET /pessoa/:id/contato`) de contatos.
- Mudar payload/validação da criação de contato (o `CreatePessoaContatoDto` permanece).
- Mudanças estruturais: criar `src/pessoa/contato/contato.controller.ts` ou alterar o `PessoaModule`.
- Persistência local, alteração de schema Prisma ou de regras CASL (não existe recurso `pessoaContato`; a edição usa a permissão `update pessoa`).

## Decisions

### 1. Rota de edição no `PessoaController`, sem controller separado

- O `PessoaController` (prefixo `@Controller('pessoa')`) ganha o handler `update` com `@Patch(':id/contato/:contatoId')`, ao lado do `@Post(':id/contato')` existente. URLs finais: `POST /pessoa/{id}/contato` (inalterada) e `PATCH /pessoa/{id}/contato/{contatoId}`.
- `update(@Param('id') id, @Param('contatoId') contatoId, @Body() dto)` chama `this.contatoService.update(+id, contatoId, dto)` (o `ContatoService` continua injetado no controller).
- Swagger: `ApiOkResponse` (200, contato atualizado), `ApiBadRequestResponse` (400, payload inválido), `ApiNotFoundResponse` (404, pessoa inexistente) e `ApiBody` com exemplo.
- *Alternativa considerada:* criar um `ContatoController` em `src/pessoa/contato/` com `@Controller('pessoa/:id/contato')`, movendo o `createContato`. Rejeitada pela decisão do usuário: em NestJS a URL vem do decorator `@Controller` (não do diretório do arquivo), então a separação de pasta não mudaria a rota; manter tudo no `PessoaController` preserva o padrão `pessoa/{id}/contato/{...}` para create e update, evita fragmentação e não mexe na criação.

### 2. `ContatoService.update(pessoaId, contatoId, dto)`

Fluxo idêntico ao `create`, trocando a ação e o método externo:
1. `this.validateUpdateAbility('pessoa')` — o PATCH de contato exige a mesma permissão do `PATCH /pessoa/:id`.
2. `this.prisma.pessoa.findUniqueOrThrow({ where: { id: pessoaId }, select: { id: true } })` — valida a existência da pessoa; inexistente propaga P2025 → 404 `O registro de 'Pessoa' não foi encontrado.` (mesmo filtro do `PrismaExceptionsFilter`, sem novo tratamento). O id externo da pessoa não é usado na atualização.
3. `this.saoPedroContatoService.updateExternalContato(contatoId, dto)`.
4. Retorna o contato atualizado (`PessoaContato`).

- *Alternativa considerada:* validar `create pessoa` por simplicidade. Rejeitada: a semântica CASL existente associa atualização à ação `update` (como em `updateExternalPessoa`/`PATCH /pessoa/:id`), e `BaseService` já expõe `validateUpdateAbility`.

### 3. `SaoPedroContatoService.updateExternalContato(contatoId, dto)`

- `PATCH ${SAO_PEDRO_API_URL}/api/contatos/${contatoId}/` dentro de `executeAuthenticatedRequest`, seguindo o padrão de autenticação de `createExternalContato` (headers, logging e retorno). A rota externa de atualização usa **somente o id do contato**.
- Payload snake_case reaproveitando `CreateContatoMapper.toExternal` — o shape de criação e de atualização é o mesmo (mesmos campos opcionais). Para tipar corretamente, ampliar a assinatura do mapper para aceitar `CreatePessoaContatoDto | UpdatePessoaContatoDto`.
- Resposta convertida por `ContatoResponseMapper.toDomain(response.data)` (camelCase `PessoaContato`).
- *Alternativa considerada:* criar um `UpdateContatoMapper` dedicado (espelhando `UpdatePessoaMapper`). Rejeitada: para contato os campos de create/update são idênticos — duplicaria mapeamento sem ganho.
- Erros da API externa (ex.: 404 de contato inexistente) são propagados como `HttpException` com o status da São Pedro, mesmo comportamento já adotado na criação.

### 4. `UpdatePessoaContatoDto` em `src/pessoa/dto/update-pessoa-contato.dto.ts`

- Mesmos campos e validadores do `CreatePessoaContatoDto` (`tipoTelefone` com enum `CELULAR|RESIDENCIAL|COMERCIAL`, `telefone` `@IsString`+`@MaxLength(20)`, `email` `@IsEmail`, `observacao`, `contatoPrincipal` `@IsBoolean`), todos `@IsOptional()` — semântica de PATCH parcial. Payload vazio é aceito (nenhum campo é enviado à São Pedro).

### 5. Testes

- `src/pessoa/pessoa.controller.spec.ts`: adiciona caso de delegação de `update(1, 'id-externo', dto)` ao `ContatoService` (mantém o caso existente do `createContato`).
- `src/pessoa/contato/contato.service.spec.ts`: casos de `update` — `ForbiddenException` sem permissão `update pessoa`, delegação `updateExternalContato(contatoId, dto)` após validar a pessoa, e propagação de P2025.
- `src/external/sao-pedro/sao-pedro-contato.service.spec.ts`: caso de `updateExternalContato` (URL `/api/contatos/{contatoId}/`, método PATCH, payload mapeado, resposta camelCase).
- `test/mocks/sao-pedro-api-mock.ts`: adiciona `updateExternalContato: vi.fn()`.
- `test/pessoa/pessoa-contato.e2e-spec.ts`: novos casos seguindo a spec `testes-e2e` — 401, 403 (mensagem `Você não tem permissão para update pessoa`), 404 (pessoa inexistente), 400 (payload inválido), 200 (sucesso com todos os campos e atualização parcial), e propagação de 404 do contato externo quando o mock lança.

## Risks / Trade-offs

- **Forma do endpoint de atualização da São Pedro** → O endpoint real é `PATCH /api/contatos/{contatoId}/` (somente o id do contato), confirmado pelo usuário. O comportamento externo esperado pela spec (200/404/400) independe do path; o ajuste fica isolado em `updateExternalContato` e nos mocks.
- **Propagação de 404 do contato externo** → O corpo virá da resposta da São Pedro, não no padrão `O registro de '...' não foi encontrado.`. Mitigação: a spec declara explicitamente a propagação; o e2e fixa o comportamento com o mock lançando o 404.
- **`PessoaController` acumulando handlers de sub-recursos** → A rota de contato junta-se a pessoa, casal e demais operações no mesmo controller. Mitigação: é a organização atual do projeto (não há novos arquivos), e o controller já injeta o `ContatoService`; a mudança é incremental e coberta por testes unitários do controller e e2e.

## Migration Plan

- Sem migração de dados nem de schema (contatos não são persistidos localmente).
- Deploy: publicação única do código — a URL de criação não muda, então não há ordem crítica entre backend e consumidores.
