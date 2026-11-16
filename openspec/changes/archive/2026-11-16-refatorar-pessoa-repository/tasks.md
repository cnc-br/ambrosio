# Tasks

## 1. Formas de consulta e `PessoaRepository` (TDD)

- [x] 1.1 Criar `src/pessoa/repositories/pessoa.includes.ts` com `PESSOA_DETALHE_INCLUDE`, `PESSOA_LISTAGEM_INCLUDE` e `PESSOA_BASICA_SELECT`, copiando literalmente os `include`/`select` hoje presentes em `pessoa.service.ts` e reutilizando `PESSOA_CARISMA_INCLUDE`, `ENDERECO_INCLUDE` e `PAROQUIA_SELECT`; verificar com `npm run build` que os tipos resolvem.
- [x] 1.2 Escrever `src/pessoa/repositories/pessoa.repository.spec.ts` com `PrismaService` mockado, cobrindo `create`, `deletePorId`, `findManyParaListagem` (where/skip/take/orderBy e include de listagem), `findDetalhadoOrThrow` (include de detalhe e where unique), `findUniquePorExternalId`, `findBasicoPorIdOrThrow`, `findNoEscopo` (where `AND` com id + escopo), `findUniqueOrThrowPorId`, `findManyElegiveisCasal` e `updatePorId`; verificar que os testes falham antes da implementação existir.
- [x] 1.3 Implementar `src/pessoa/repositories/pessoa.repository.ts` como `@Injectable()` fino sobre `PrismaService`, com entradas/saídas tipadas por `Prisma` e sem capturar/traduzir erros; verificar que `pessoa.repository.spec.ts` passa com `npm run test -- pessoa.repository`.
- [x] 1.4 Adicionar um teste no spec do repositório de que um erro `P2025` de `findUniqueOrThrow` é propagado sem alteração; verificar que o teste passa e que nenhum `catch` foi adicionado no repositório.
- [x] 1.5 Registrar `PessoaRepository` em `providers` do `PessoaModule`; verificar com `npm run test` que a injeção do módulo continua resolvendo.

## 2. `PessoaCasalRepository` (TDD)

- [x] 2.1 Escrever `src/pessoa/repositories/pessoa-casal.repository.spec.ts` cobrindo `create` e `findFirst` com `PrismaService.pessoaCasal` mockado, incluindo a propagação de erros do Prisma; verificar que os testes falham antes da implementação existir.
- [x] 2.2 Implementar `src/pessoa/repositories/pessoa-casal.repository.ts` como `@Injectable()` fino sobre `PrismaService`, com `create(data)` e `findFirst(where)` tipados; verificar que `npm run test -- pessoa-casal.repository` passa.
- [x] 2.3 Registrar `PessoaCasalRepository` em `providers` do `PessoaModule`; verificar com `npm run test` que a injeção do módulo continua resolvendo.

## 3. Refatorar `PessoaService`

- [x] 3.1 Atualizar `src/pessoa/pessoa.service.spec.ts` para prover mocks de `PessoaRepository` e `PessoaCasalRepository` em vez de `PrismaService`, preservando as asserções de criação, rollback, listagem, detalhe, atualização, escopo e CPF; verificar que os testes falham apenas pelos nomes/assinaturas ainda não usados pelo serviço.
- [x] 3.2 Refatorar `src/pessoa/pessoa.service.ts` para consumir os repositórios, remover a dependência de `PrismaService` e manter CASL, validações, chamadas à São Pedro, serialização e rollback no serviço; verificar que `npm run test -- pessoa.service` passa.
- [x] 3.3 Confirmar que `findOne`/`findByExternalId`/`validarPessoaDentroDoEscopoDeAtualizacao` mantêm 404 via `P2025` e 403 via escopo; verificar que os testes correspondentes de `pessoa.service.spec.ts` passam sem alteração de expectativa de erro.

## 4. Refatorar `CasalService`

- [x] 4.1 Atualizar `src/pessoa/casal/casal.service.spec.ts` para prover `PessoaRepository` e `PessoaCasalRepository` mockados, mantendo as asserções do `where` de escopo de paróquia, da criação do casal e da propagação de `P2025`; verificar que os testes falham apenas pela implementação ainda não refatorada.
- [x] 4.2 Refatorar `src/pessoa/casal/casal.service.ts` para usar os repositórios no lugar de `PrismaService`, mantendo `PessoaService` apenas para validação de escopo; verificar que `npm run test -- casal.service` passa.
- [x] 4.3 Confirmar que `findAllBySexoEstadoCivilCasado` continua produzindo o mesmo `where` de escopo (ADMIN vs `SECRETARIA_CNC`) e o mesmo `select` básico; verificar com as asserções atualizadas do spec.

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run test` e verificar que toda a suíte unitária passa.
- [x] 5.2 Rodar `npm run test:e2e` (com banco disponível e seed) e verificar que `test/pessoa/pessoa-create.e2e-spec.ts`, `test/pessoa/pessoa-update-scope.e2e-spec.ts` e `test/pessoa/pessoa-contato.e2e-spec.ts` continuam passando sem alteração.
- [x] 5.3 Rodar `npm run build` e `npm run lint` e verificar que não há erros de compilação, lint ou imports ESM.
- [x] 5.4 Verificar com `grep -n "PrismaService" src/pessoa/pessoa.service.ts src/pessoa/casal/casal.service.ts` que os serviços não referenciam mais o Prisma diretamente.
- [x] 5.5 Revisar o diff e confirmar que nenhum DTO, controller, serializer, schema Prisma ou endpoint foi alterado; verificar com `git diff --stat`.

## Workflow follow-up

- Revisar os artefatos e implementar via `/opsx-apply`.
- Arquivar o change após a implementação e a revisão do projeto serem concluídas.