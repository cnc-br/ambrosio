# Tasks

## 1. Permissão CASL de atualização de pessoa

- [x] 1.1 Adicionar a condição de `update` de `pessoa` para `SECRETARIA_CNC` em `src/casl/casl-ability/casl-ability.service.ts`, com `OR` entre `comunidadePessoas: { none: { dataSaida: null } }` e `comunidadePessoas: { some: { dataSaida: null, comunidade: { is: { paroquia: { is: { usuarioParoquias: { some: { userId } } } } } } } }`. Verificação: `npx vitest run src/casl/casl-ability/casl-ability.service.spec.ts` passa.
- [x] 1.2 Adicionar teste em `src/casl/casl-ability/casl-ability.service.spec.ts` que `accessibleBy(ability, 'update').pessoa` retorna a condição esperada para `SECRETARIA_CNC`, e que `read` e `create` de `pessoa` continuam sem condição. Verificação: o teste passa.
- [x] 1.3 Adicionar teste que `accessibleBy(ability, 'update').pessoa` de `ADMIN` é `{}`. Verificação: o teste passa.

## 2. Validação de escopo no serviço de pessoa

- [x] 2.1 Adicionar `validarPessoaDentroDoEscopoDeAtualizacao(id)` no `PessoaService` com `accessibleBy` + `findFirst` + `findUniqueOrThrow` + `ForbiddenException`, e chamá-la antes de `findOne(id)` no `update`. Verificação: `npx vitest run src/pessoa/pessoa.service.spec.ts` passa.
- [x] 2.2 Adicionar `pessoa.findFirst` ao `prismaMock` de `src/pessoa/pessoa.service.spec.ts` e ajustar o helper `setAdminAbility` para mockar o `findFirst` retornando a pessoa. Verificação: os testes de `update` existentes continuam passando.
- [x] 2.3 Adicionar testes de `SECRETARIA_CNC` com vínculo ativo em paróquia do usuário (200), vínculo ativo em outra paróquia (403), sem vínculo (200), vínculo encerrado (200), vínculo ativo em paróquia própria e de terceiros (200) e pessoa inexistente (404). Verificação: `npx vitest run src/pessoa/pessoa.service.spec.ts` passa.
- [x] 2.4 Adicionar teste de `ADMIN` em que `findFirst` retorna `{}` e o `update` continua sem restrição. Verificação: o teste passa.

## 3. Casal e cônjuge

- [x] 3.1 Injetar `PessoaService` em `CasalService` e, no `createCasal`, validar `pessoaId` e `conjugueId` com `validarPessoaDentroDoEscopoDeAtualizacao` antes de qualquer escrita. Verificação: `npx vitest run src/pessoa/casal/casal.service.spec.ts` passa.
- [x] 3.2 No `CasalService.findAllBySexoEstadoCivilCasado`, chamar `validateReadAbility('pessoa')` e filtrar o `findMany` com `comunidadePessoas: { some: { dataSaida: null, comunidade: { is: { paroquia: { is: { usuarioParoquias: { some: { userId } } } } } } } }`, restringindo o `GET /pessoa/conjugue` às paróquias do usuário. Verificação: `npx vitest run src/pessoa/casal/casal.service.spec.ts` passa.
- [x] 3.3 Atualizar `src/pessoa/casal/casal.service.spec.ts` para prover `PessoaService` e cobrir: casal com as duas pessoas no escopo (201), uma fora (403), ambas fora (403), sem vínculo ativo (201), `ADMIN` (201) e pessoa inexistente (404). Verificação: `npx vitest run src/pessoa/casal/casal.service.spec.ts` passa.
- [x] 3.4 Adicionar testes de `findAllBySexoEstadoCivilCasado` com `SECRETARIA_CNC` (apenas paróquias do usuário), `SECRETARIA_CNC` sem paróquias (lista vazia) e `ADMIN` (todos). Verificação: `npx vitest run src/pessoa/casal/casal.service.spec.ts` passa.

## 4. Contato

- [x] 4.1 Injetar `PessoaService` em `ContatoService` e validar `pessoaId` com `validarPessoaDentroDoEscopoDeAtualizacao` no `create` e no `update`, antes de chamar a São Pedro. Verificação: `npx vitest run src/pessoa/contato/contato.service.spec.ts` passa.
- [x] 4.2 Atualizar `src/pessoa/contato/contato.service.spec.ts` para prover `PessoaService` e cobrir: criação/atualização em pessoa do escopo (201/200), fora do escopo (403), sem vínculo ativo (201/200), `ADMIN` (201/200) e pessoa inexistente (404). Verificação: `npx vitest run src/pessoa/contato/contato.service.spec.ts` passa.

## 5. Documentação da API

- [x] 5.1 Adicionar `@ApiForbiddenResponse` e `@ApiNotFoundResponse` ao `PATCH /pessoa/:id`, `POST /pessoa/casal`, `GET /pessoa/conjugue`, `POST /pessoa/:id/contato` e `PATCH /pessoa/:id/contato/:contatoId` em `src/pessoa/pessoa.controller.ts`, documentando o 403 de escopo e o 404. Verificação: `npm run build` passa e o Swagger expõe as respostas.
- [x] 5.2 Adicionar `@ApiBadRequestResponse` e `@ApiConflictResponse` ao `PATCH /pessoa/:id`, documentando os 400 (CPF inválido) e 409 (CPF já cadastrado) já existentes. Verificação: `npm run build` passa e o Swagger expõe as respostas.

## 6. Integração e2e

- [x] 6.1 Adicionar `test/pessoa/pessoa-update-scope.e2e-spec.ts` com `SECRETARIA_CNC` de duas paróquias: `GET /pessoa` e `GET /pessoa/:id` retornam todas as pessoas; `PATCH /pessoa/:id` da própria paróquia responde 200; de outra paróquia responde 403; pessoa sem vínculo responde 200; vínculo encerrado responde 200. Verificação: `npm run test:e2e -- test/pessoa/pessoa-update-scope.e2e-spec.ts` passa.
- [x] 6.2 Adicionar ao mesmo teste e2e: `POST /pessoa/casal` com as duas pessoas no escopo (201), com uma fora (403), `GET /pessoa/conjugue` com `SECRETARIA_CNC` (apenas próprias), `POST /pessoa/:id/contato` e `PATCH /pessoa/:id/contato/:contatoId` em pessoa do escopo (201/200) e fora (403). Verificação: `npm run test:e2e -- test/pessoa/pessoa-update-scope.e2e-spec.ts` passa.
- [x] 6.3 Rodar `npm run test` e `npm run test:e2e` para verificar regressão dos testes existentes. Verificação: ambos os comandos passam.

## Workflow follow-up

- Archive the change after the project's review requirements are satisfied.
- Verify the archived result.
