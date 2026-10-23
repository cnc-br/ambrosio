# Spec Delta

## Purpose

Gerencia as contas de acesso (usuários) do sistema, definindo o contrato de exclusão de um usuário por id — com controle de permissão, resposta `204` sem corpo e preservação dos dados de domínio vinculados.

## ADDED Requirements

### Requirement: Exclusão de usuário por id

O sistema SHALL permitir excluir um usuário a partir do seu id por meio da rota `DELETE /users/:id`, apenas para usuários com permissão de exclusão sobre o recurso `user`. Ao excluir com sucesso, o sistema SHALL responder `204 No Content` sem corpo, e o usuário SHALL deixar de existir.

#### Scenario: Exclusão de usuário existente com permissão
- **WHEN** um usuário com permissão de exclusão chama `DELETE /users/:id` com o id de um usuário existente
- **THEN** o sistema responde 204, sem corpo na resposta, e a consulta ao usuário excluído responde 404

#### Scenario: Resposta sem corpo
- **WHEN** um usuário com permissão de exclusão chama `DELETE /users/:id` com o id de um usuário existente
- **THEN** a resposta não contém corpo, tampouco dados sensíveis do registro excluído (hash de senha ou tokens de recuperação)

### Requirement: Usuário inexistente na exclusão

O sistema SHALL responder 404 quando `DELETE /users/:id` receber o id de um usuário que não existe, sem excluir nenhum registro.

#### Scenario: Usuário não encontrado
- **WHEN** um usuário com permissão de exclusão chama `DELETE /users/:id` com um id de usuário inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Usuário' não foi encontrado.` e `statusCode` 404

### Requirement: Cascata de exclusão dos vínculos usuário–paróquia

Ao excluir um usuário, o sistema SHALL remover automaticamente os vínculos `usuarioParoquia` dele, preservando as paróquias vinculadas.

#### Scenario: Vínculos usuário–paróquia removidos
- **WHEN** um usuário que possui vínculos com paróquias é excluído
- **THEN** os vínculos `usuarioParoquia` dele são removidos e as paróquias vinculadas continuam existindo

### Requirement: Preservação da pessoa vinculada

Ao excluir um usuário, o sistema SHALL NOT excluir a pessoa vinculada a ele (`pessoaId`), preservando o registro e seus dados associados.

#### Scenario: Pessoa preservada
- **WHEN** um usuário com `pessoaId` vinculado é excluído
- **THEN** a pessoa vinculada continua existindo e continua acessível

### Requirement: Permissão de exclusão

O sistema SHALL exigir autenticação e permissão de exclusão sobre o recurso `user` para processar `DELETE /users/:id`; sem token ou sem permissão, o sistema SHALL rejeitar a exclusão.

#### Scenario: Exclusão sem autenticação
- **WHEN** `DELETE /users/:id` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Exclusão por usuário autenticado sem permissão
- **WHEN** um usuário autenticado sem permissão de exclusão sobre `user` chama `DELETE /users/:id`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para delete user`, `error` `Forbidden` e `statusCode` 403