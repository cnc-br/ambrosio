# Proposal

## Why

O cadastro e a atualização de uma pessoa não registram quem executou a operação. Sem essa autoria, não é possível auditar quem criou ou alterou um registro — uma necessidade operacional da secretaria e dos administradores.

## What Changes

- O model `pessoa` passa a ter `cadastradoPorId` e `atualizadoPorId` (`String?`), referenciando `user.id` (cuid) por relações nomeadas, com `onDelete: SetNull`.
- Não há backfill: registros existentes permanecem com os dois campos `NULL`. O default textual "Leonardo - Sistema" foi descartado.
- Os campos de data já existentes no model (`createdAt`/`updatedAt`) permanecem inalterados, com seus defaults atuais.
- `PessoaController` recebe o id do usuário autenticado com `@CurrentUser('id')` em `POST /pessoa` e `PATCH /pessoa/:id` e o repassa ao service. O id nunca é aceito no payload.
- `PessoaService.create` grava `cadastradoPorId` e `atualizadoPorId` com o id do usuário autenticado; `PessoaService.update` grava `atualizadoPorId` após a atualização externa bem-sucedida.
- Os campos de autoria **não** aparecem nos payloads de resposta: o serializer de pessoa continua expondo apenas a lista explícita de campos de domínio.
- Sem **BREAKING** nos contratos HTTP: nenhum campo novo entra ou sai dos payloads de request/response.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `pessoa`: o cadastro e a atualização passam a registrar a autoria (usuário autenticado), sem expor esses campos nas respostas.

## Impact

- **Banco/Prisma**: `prisma/schema.prisma` (`pessoa` e relações reversas em `user`) e nova migration adicionando `cadastradoPorId`/`atualizadoPorId` com FKs para `user(id)` e `ON DELETE SET NULL`. Nenhuma coluna de data é criada ou alterada.
- **Código**: `src/pessoa/pessoa.controller.ts` (decorator `CurrentUser`), `src/pessoa/pessoa.service.ts` (assinaturas de `create`/`update` e persistência da autoria).
- **Testes**: `src/pessoa/pessoa.service.spec.ts`, `src/pessoa/pessoa.controller.spec.ts`, `src/pessoa/pessoa.serializer.spec.ts` e `test/pessoa/pessoa-create.e2e-spec.ts`.
- **API**: contratos de `POST /pessoa` e `PATCH /pessoa/:id` inalterados; nenhum campo novo no request/response.
- **Integrações**: nenhuma alteração na API externa São Pedro.
