# Proposal

## Why

Hoje o perfil `SECRETARIA_CNC` pode atualizar qualquer pessoa cadastrada, porque a permissão `update` de `pessoa` é concedida sem condição de escopo. O perfil deve continuar vendo todas as pessoas, mas só pode editar pessoas que estejam na(s) paróquia(s) sob sua responsabilidade.

## What Changes

- **Leitura preservada**: `SECRETARIA_CNC` continua vendo todas as pessoas na listagem e no detalhe, sem filtro de paróquia.
- **Edição restrita**: `SECRETARIA_CNC` passa a receber `403` ao tentar `PATCH /pessoa/:id` de uma pessoa que não pertence a uma paróquia vinculada a ele.
- **Pessoa sem vínculo**: uma pessoa sem nenhum vínculo ativo com comunidade (portanto, sem paróquia) continua editável por `SECRETARIA_CNC`.
- **Vínculos encerrados**: apenas vínculos com `dataSaida` nula contam como vínculo ativo; vínculos históricos não autorizam a edição.
- **Casal (`POST /pessoa/casal`)**: `SECRETARIA_CNC` só pode criar o casal quando as duas pessoas estão no escopo; qualquer uma fora do escopo retorna 403.
- **Cônjuge (`GET /pessoa/conjugue`)**: `SECRETARIA_CNC` lista apenas cônjuges disponíveis de pessoas nas suas paróquias; `ADMIN` continua vendo todos.
- **Contato (`POST /pessoa/:id/contato` e `PATCH /pessoa/:id/contato/:contatoId`)**: `SECRETARIA_CNC` só cria ou atualiza contatos de pessoas no escopo; pessoa fora do escopo retorna 403.
- **Sem exclusão**: a API não possui endpoint de exclusão de pessoa; o escopo da mudança não cria `DELETE /pessoa/:id`.
- **Demais perfis preservados**: `ADMIN` continua sem restrição; `create` de pessoa e os demais endpoints de pessoa não mudam.

## Capabilities

### New Capabilities

<!-- Nenhuma nova capability. -->

### Modified Capabilities

- `pessoa`: a autorização de atualização de pessoa passa a incluir o escopo de paróquia para `SECRETARIA_CNC`; a leitura de `GET /pessoa` e `GET /pessoa/:id` permanece irrestrita; a criação de casal e a leitura de cônjuges passam a seguir o mesmo escopo.
- `pessoa-contato`: a criação e a atualização de contato passam a exigir que a pessoa esteja no escopo de paróquia do `SECRETARIA_CNC`.

## Impact

- **Código**: `src/casl/casl-ability/casl-ability.service.ts` (condição de `update` de `pessoa`), `src/pessoa/pessoa.service.ts` (validação de escopo no `update`), `src/pessoa/casal/casal.service.ts` (validação de escopo no casal e no cônjuge), `src/pessoa/contato/contato.service.ts` (validação de escopo na criação/atualização de contato), `src/pessoa/pessoa.controller.ts` (documentação Swagger), e testes unitários/e2e correspondentes.
- **API**: `PATCH /pessoa/:id`, `POST /pessoa/casal`, `GET /pessoa/conjugue`, `POST /pessoa/:id/contato` e `PATCH /pessoa/:id/contato/:contatoId` passam a responder `403` para `SECRETARIA_CNC` fora do escopo; `GET /pessoa` e `GET /pessoa/:id` mantêm o comportamento atual.
- **Banco**: sem alterações de schema; as consultas usam `comunidadePessoa` → `comunidade` → `paroquia` → `usuarioParoquia`.
- **Dependências**: `@casl/prisma` já suporta `some`/`none`/`OR` e `accessibleBy`; sem novas dependências.
