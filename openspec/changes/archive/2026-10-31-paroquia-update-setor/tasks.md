# Tasks

## 1. Guard de setor opcional no service

- [x] 1.1 Ajustar `ParoquiaService.update` (src/paroquia/paroquia.service.ts) para gravar `setorId` somente quando `updateParoquiaDto.setor` estiver presente, usando spread condicional no `data` do `transaction.paroquia.update` (`...(updateParoquiaDto.setor && { setorId: updateParoquiaDto.setor.id })`). Verificar que um PATCH sem `setor` deixa de lançar `TypeError` (o teste e2e existente, `test/paroquia.e2e-spec.ts` ~linha 358, volta a responder 200).

## 2. Testes unitários do update

- [x] 2.1 No `src/paroquia/paroquia.service.spec.ts`, preparar um `describe` isolado para o `update`: estender o mock do `PrismaService` com `paroquia.findFirstOrThrow` e `$transaction` (invocando o callback com um client fake cujo `paroquia.update` é um `vi.fn()` que grava o `data`), além de `vi.spyOn` em `dioceseService.findOne` (resolvendo uma diocese fake) e `enderecoService.update` (resolvendo um endereco fake), e neutralizar `validateUpdateAbility`/`validateReadAbility` com `mockImplementation(() => {})`. Verificar que o setup compila e roda (`npm test -- src/paroquia` sem falhas no caso de DI existente).
- [x] 2.2 Adicionar caso "update salva o setor informado": chamar `service.update(id, dto)` com `setor: { id: novoSetorId }` e verificar que o `data` passado ao `paroquia.update` contém `setorId` igual ao novo id e que o retorno serializado expõe `setor.id` novo. Verificar passando (`npm test -- src/paroquia`).
- [x] 2.3 Adicionar caso "update sem setor mantém o setor atual": chamar `service.update(id, dto)` sem `setor` e verificar que o `data` passado ao `paroquia.update` NÃO contém a chave `setorId` (assertar sobre `data`, não apenas na resposta, para não mascarar um 502 engolido pelo try/catch), mantendo os demais campos (`descricao`, `enderecoId`, `dioceseId`). Verificar passando (`npm test -- src/paroquia`).

## 3. Testes e2e do PATCH /paroquia/:id

- [x] 3.1 Adicionar caso em `test/paroquia.e2e-spec.ts` no formato `/paroquia/:id (PATCH) - 200 | deve atualizar o setor da paroquia quando informado`: criar uma paróquia dentro do próprio caso (padrão do arquivo) com `setor: { id: 1 }`, fazer `PATCH /paroquia/:id` com `setor: { id: 2 }` (setor existente no seed) e verificar 200 e `response.body.data.setor.id === 2`. Verificar passando `npm run test:e2e -- test/paroquia.e2e-spec.ts`.
- [x] 3.2 Adicionar caso em `test/paroquia.e2e-spec.ts` no formato `/paroquia/:id (PATCH) - 200 | deve manter o setor atual quando setor nao informado`: PATCH sem o campo `setor` (demais campos válidos) responde 200 e `response.body.data.setor.id` permanece igual ao setor original da paróquia criada no caso. Verificar passando `npm run test:e2e -- test/paroquia.e2e-spec.ts`.

## 4. Verificação integrada

- [x] 4.1 Rodar a suíte unitária de paróquia (npm test) e a suíte e2e de paróquia (`npm run test:e2e`) e verificar que nada fora do escopo quebrou (incluindo o PATCH 200 existente sem `setor`); confirmar também `npm run lint` sem novos erros nos arquivos tocados.
