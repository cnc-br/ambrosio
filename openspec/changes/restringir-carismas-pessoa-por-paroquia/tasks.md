# Tasks

## 1. Validação no CarismaService

- [x] 1.1 Adicionar `this.validateUpdateAbility('pessoa')` e `await this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(pessoaId)` no início de `addCarismaToPessoa`, antes de qualquer escrita, e verificar com `npm run test` que o `CarismaService` continua compilando e os testes passam.
- [x] 1.2 Substituir a chamada `this.pessoaService.findOne(pessoaId)` por `validarPessoaDentroDoEscopoDeAtualizacao(pessoaId)` e verificar com `npm run test` que a validação de existência e de escopo continua sendo exercitada.

## 2. Documentação Swagger

- [x] 2.1 Adicionar `@ApiForbiddenResponse` e `@ApiNotFoundResponse` ao endpoint `POST /carismas/pessoa/:pessoaId` e verificar com `npm run build` que a documentação compila.

## 3. Testes unitários

- [x] 3.1 Atualizar `src/carisma/carisma.service.spec.ts` com cenários de `SECRETARIA_CNC` dentro e fora do escopo, `ADMIN`, pessoa sem vínculo e pessoa inexistente, e verificar com `npm run test` que os testes passam.

## 4. Testes e2e

- [x] 4.1 Criar `test/carisma/carisma-scope.e2e-spec.ts` com `SECRETARIA_CNC` de duas paróquias, `ADMIN`, pessoa sem vínculo e pessoa inexistente, e verificar com `npm run test:e2e -- test/carisma/carisma-scope.e2e-spec.ts` que os testes passam.

## 5. Integração

- [x] 5.1 Rodar `npm run build`, `npm run test` e `npm run test:e2e` e verificar que todos passam.

## Workflow follow-up

- Arquivar a mudança após a revisão e a verificação do projeto.
