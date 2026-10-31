# Paroquia Specification

## Purpose

Gerencia paróquias do sistema, definindo o contrato de exclusão de uma paróquia por id — incluindo controle de permissão e remoção em cascata das comunidades vinculadas.

## Requirements

### Requirement: Exclusão de paróquia por id

O sistema SHALL permitir excluir uma paróquia a partir do seu id por meio da rota `DELETE /paroquia/:id`, apenas para usuários com permissão de exclusão sobre o recurso `paroquia`. Ao excluir com sucesso, o sistema SHALL retornar a paróquia excluída.

#### Scenario: Exclusão de paróquia existente com permissão
- **WHEN** um usuário com permissão de exclusão chama `DELETE /paroquia/:id` com o id de uma paróquia existente
- **THEN** o sistema responde 200 e retorna a paróquia excluída no corpo da resposta

#### Scenario: Exclusão do endereço vinculado
- **WHEN** uma paróquia é excluída
- **THEN** o sistema remove também o `endereco` vinculado à paróquia (`enderecoId`), e a consulta a esse endereço responde 404

#### Scenario: Exclusão preserva diocese e setor
- **WHEN** uma paróquia é excluída
- **THEN** o sistema não remove a `diocese` ou o `setor` associados à paróquia excluída

### Requirement: Paróquia inexistente na exclusão

O sistema SHALL responder 404 quando `DELETE /paroquia/:id` receber o id de uma paróquia que não existe, sem excluir nenhum registro.

#### Scenario: Paróquia não encontrada
- **WHEN** um usuário com permissão de exclusão chama `DELETE /paroquia/:id` com um id de paróquia inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Paroquia' não foi encontrado.` e `statusCode` 404

### Requirement: Cascata de exclusão das comunidades

Ao excluir uma paróquia, o sistema SHALL remover automaticamente todas as comunidades vinculadas a ela, e SHALL remover também os registros dependentes dessas comunidades (históricos, vínculos de pessoas e etapas).

#### Scenario: Comunidades vinculadas removidas
- **WHEN** uma paróquia que possui comunidades vinculadas é excluída
- **THEN** as comunidades vinculadas deixam de existir e a consulta a qualquer uma delas responde 404

#### Scenario: Registros dependentes das comunidades removidos
- **WHEN** uma paróquia cujas comunidades possuem históricos, vínculos de pessoas ou etapas é excluída
- **THEN** os históricos, vínculos de pessoas e etapas dessas comunidades também deixam de existir

### Requirement: Permissão de exclusão

O sistema SHALL exigir autenticação e permissão de exclusão sobre o recurso `paroquia` para processar `DELETE /paroquia/:id`; sem token ou sem permissão, o sistema SHALL rejeitar a exclusão.

#### Scenario: Exclusão sem autenticação
- **WHEN** `DELETE /paroquia/:id` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Exclusão por usuário autenticado sem permissão
- **WHEN** um usuário autenticado sem permissão de exclusão sobre `paroquia` chama `DELETE /paroquia/:id`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para delete paroquia`, `error` `Forbidden` e `statusCode` 403

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