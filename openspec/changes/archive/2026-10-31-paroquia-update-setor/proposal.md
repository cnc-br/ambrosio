# Proposal

## Why

O `ParoquiaService.update` passou a persistir também o `setor` da paróquia ao atualizar (linha `setorId: updateParoquiaDto.setor.id`), mas esse comportamento não tem cobertura de testes — nem unitários, nem e2e. Além disso, `setor` é opcional no `UpdateParoquiaDto` (derivado de `PartialType(CreateParoquiaDto)`), então ler `updateParoquiaDto.setor.id` de forma incondicional faz um PATCH sem `setor` no payload lançar `TypeError` e responder 502 — o que quebraria o teste e2e de atualização existente, que não envia `setor`.

## What Changes

- Ajusta `ParoquiaService.update` para gravar `setorId` somente quando `updateParoquiaDto.setor` é enviado no payload; quando omitido, a paróquia mantém o `setor` atual (comportamento compatível com o DTO opcional).
- Adiciona testes unitários para `ParoquiaService.update` em `src/paroquia/paroquia.service.spec.ts`:
  - atualiza `setorId` com o novo setor quando `setor` é enviado no DTO;
  - preserva o `setorId` atual quando `setor` é omitido do DTO;
  - mantém a atualização dos demais campos (`descricao`, `endereco`, `diocese`).
- Adiciona testes e2e para `PATCH /paroquia/:id` no `test/paroquia.e2e-spec.ts`, seguindo o padrão da spec `testes-e2e`:
  - atualizar uma paróquia com novo `setor` responde 200 e o `setor.id` retornado reflete o novo setor;
  - atualizar uma paróquia sem `setor` responde 200 e mantém o `setor` atual vinculado.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova: o comportamento já pertence à gestão de paróquias. -->

### Modified Capabilities
- `paroquia`: requisito de atualização de paróquia alterado — o `PATCH /paroquia/:id` passa a salvar o `setor` informado e a tolerar payload sem `setor` (mantendo o setor atual).

## Impact

- `src/paroquia/paroquia.service.ts` — guard no `update` para `setor` opcional (1 linha de lógica).
- `src/paroquia/paroquia.service.spec.ts` — novos casos unitários para o método `update`.
- `test/paroquia.e2e-spec.ts` — novos casos e2e para o `PATCH /paroquia/:id` cobrindo o vínculo de setor.
- Nenhuma mudança de schema, migration ou API de entrada (DTOs inalterados).

### Não faz parte deste escopo
- Alteração de validação dos DTOs (ex.: tornar `setor` obrigatório no `UpdateParoquiaDto`).
- Regras de permissão CASL para a atualização.
- Persistência de outros vínculos da paróquia além de `setor`.
