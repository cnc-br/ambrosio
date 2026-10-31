# Spec Delta

## ADDED Requirements

### Requirement: Atualização salva o setor informado

O sistema SHALL atualizar o `setor` vinculado à paróquia quando `PATCH /paroquia/:id` receber `setor` no payload, persistindo o novo `setorId` e retornando a paróquia atualizada com o novo `setor`.

#### Scenario: Atualização de paróquia com novo setor
- **WHEN** um usuário com permissão de atualização envia `PATCH /paroquia/:id` com `setor: { id }` de um setor existente
- **THEN** o sistema responde 200 e retorna a paróquia atualizada com `setor.id` igual ao setor informado

### Requirement: Atualização sem setor mantém o setor atual

O sistema SHALL manter o `setor` atualmente vinculado à paróquia quando `PATCH /paroquia/:id` não incluir `setor` no payload, persistindo os demais campos informados sem alterar o `setorId`.

#### Scenario: Atualização de paróquia sem setor no payload
- **WHEN** um usuário com permissão de atualização envia `PATCH /paroquia/:id` sem o campo `setor`
- **THEN** o sistema responde 200, atualiza os demais campos informados e mantém o `setor.id` previamente vinculado à paróquia
