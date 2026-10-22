# Proposal

## Why

O `ParoquiaService.remove(id)` é um stub — retorna apenas uma string template — enquanto o endpoint `DELETE /paroquia/:id` já está exposto no controller. Logo, uma paróquia não pode ser excluída pelo sistema, e não há nenhuma validação de permissão nem tratamento dos registros dependentes (comunidades) ao tentar excluí-la.

## What Changes

- Implementa `ParoquiaService.remove(id)`: valida permissão com `this.validateDeleteAbility('paroquia')` e exclui a paróquia pelo id via `this.prisma.paroquia.delete({ where: { id } })`.
- Exclui também o `endereco` vinculado à paróquia (`enderecoId`): a exclusão da paróquia e do seu endereço ocorre em uma única transação (`$transaction`), garantindo atomicidade.
- Adiciona `onDelete: Cascade` na relação `comunidade.paroquia` (lado `comunidade`) no `prisma/schema.prisma`, de modo que excluir uma paróquia remova automaticamente, em cascata, todas as comunidades vinculadas a ela.
  - As comunidades já possuem `onDelete: Cascade` para `comunidadeEtapa`, `comunidadePessoa` e `comunidadeHistorico`, então esses registros dependentes também são removidos em cascata.
  - A relação `usuarioParoquia.paroquia` já possui `onDelete: Cascade`, removendo automaticamente os vínculos usuário–paróquia.
- Gera a migração Prisma correspondente à alteração do schema.
- Adiciona testes e2e para `DELETE /paroquia/:id` no `test/paroquia.e2e-spec.ts`, seguindo o padrão definido pela spec `testes-e2e`.

## Capabilities

### New Capabilities
- `paroquia`: Gestão de paróquias — cobre a exclusão de uma paróquia por id, incluindo validação de permissão de exclusão, erro de não encontrada e remoção em cascata das comunidades vinculadas.

### Modified Capabilities
<!-- Nenhuma capacidade existente tem requisitos alterados: o vínculo de cada relação de cascade sob `comunidade` já existe, e a spec `testes-e2e` já exige a cobertura de 401/403/404 e caminhos de sucesso que os novos casos seguirão. -->

## Impact

- `src/paroquia/paroquia.service.ts` — implementa `remove` com validação de permissão e exclusão real no banco.
- `prisma/schema.prisma` — relação `comunidade.paroquia` passa a declarar `onDelete: Cascade`.
- Nova migração Prisma (cascade na FK `comunidade.paroquiaId`).
- `test/paroquia.e2e-spec.ts` — novos casos de teste para o `DELETE /paroquia/:id`.
- Comportamento de dados: excluir uma paróquia apaga também suas comunidades e os registros dependentes destas (históricos, pessoas vinculadas, etapas), os vínculos `usuarioParoquia` e o `endereco` vinculado à paróquia (`enderecoId`) — efeito observável e **irreversível**.

### Não faz parte deste escopo
- Soft delete / inativação em vez de exclusão física (`DELETE`).
- Alteração de permissões CASL além do uso de `validateDeleteAbility('paroquia')`.
- Exclusão de `diocese` ou `setor` referenciados pela paróquia.