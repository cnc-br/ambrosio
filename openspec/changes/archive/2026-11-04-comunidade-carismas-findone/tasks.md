# Tasks

## 1. TDD — Teste do serializer de carismas

- [x] 1.1 Escrever um teste de unidade de `serializeComunidadeResponse` que, dado um `comunidade` de prisma contendo `comunidadePessoas` com `pessoa.pessoaCarismas`, produza o array `carismas` agregado por carisma (id/descricao/tipo) com cada `pessoas` preenchida. Verificar: `npm run test` passa e o shape casa com `ComunidadeCarisma`.
- [x] 1.2 No mesmo teste, cobrir o caso de pessoa com cônjuge (`pessoaCasal`) e carisma `casalAndaJunto: true`: espera-se `casal: true`, `conjugue` com `id`/`externalId`/`nome`. E o caso de pessoa sem cônjuge: `casal: false`, `conjugue` ausente. Verificar: `npm run test` passa.
- [x] 1.3 Cobrir comunidade sem pessoas com carisma: `carismas` retorna `[]` (não `undefined`). Verificar: `npm run test` passa.

## 2. Implementação — include no findOne e resolução externa

- [x] 2.1 Adicionar ao `include` de `comunidade.service.ts#findOne` a cadeia `comunidadePessoas → pessoa → pessoaCarismas` (reutilizando `PESSOA_CARISMA_INCLUDE` de `src/prisma/includes.ts`). Verificar: `npm run test` continua verde e o `findOne` existente não quebra.
- [x] 2.2 Implementar no `ComunidadeService` a coleta dos `externalId` das pessoas e dos cônjuges (`pessoaCasal`) e a resolução de `nome` via `SaoPedroPessoaService.findExternalPessoaByUuid` (ou lookup em lote, se disponível), montando um mapa `externalId → { id, externalId, nome }`. Verificar: o teste de unidade do passo 1 (que injeta o mock de `SaoPedroPessoaService`) passa.

## 3. Serialização — montar carismas no serializer

- [x] 3.1 Estender `comunidade.serialize.ts` para receber os dados resolvidos e montar `carismas`, agrupando as pessoas por carisma e preenchendo `casal`/`conjugue` conforme `pessoaCasal` + `carisma.casalAndaJunto`; retornar `[]` quando não houver pessoas com carisma. Verificar: `npm run test` passa para `comunidade.serialize` e `comunidade.service`.

## 4. Integração — teste e2e / controller

- [x] 4.1 Atualizar o teste de controller/e2e de comunidade (ou criar quando necessário) para garantir que `GET /comunidade/:id` retorne o campo `carismas` no corpo conforme o spec, mantendo os demais campos intactos. Verificar: `npm run test:e2e` passa (ou, se o e2e não cobrir o caso, `npm run test` cobre via service).
- [x] 4.2 Rodar a suíte completa (`npm run test` e, se aplicável, `npm run test:e2e`) e confirmar que nenhum teste existente de `findOne`/`findAll` de comunidade regrediu. Verificar: suíte verde.