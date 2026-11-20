# Usuario Specification

## Purpose

Gerencia as contas de acesso (usuários) do sistema, definindo o contrato de exclusão de um usuário por id — com controle de permissão, resposta `204` sem corpo e preservação dos dados de domínio vinculados.

## Requirements

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

### Requirement: Vínculo usuário–região

O sistema SHALL manter o vínculo entre usuários e regiões em `usuarioRegiao`, com um registro por par usuário–região e sem duplicidade. Ao excluir um usuário, o sistema SHALL remover os vínculos `usuarioRegiao` dele, preservando as regiões. Ao excluir uma região, o sistema SHALL remover os vínculos dos usuários com essa região, preservando os usuários.

#### Scenario: Vínculo criado sem duplicidade
- **WHEN** um usuário é vinculado à mesma região mais de uma vez
- **THEN** o sistema mantém apenas um vínculo entre esse usuário e essa região

#### Scenario: Exclusão de usuário remove os vínculos de região
- **WHEN** um usuário com vínculos em `usuarioRegiao` é excluído
- **THEN** os vínculos dele são removidos e as regiões continuam existindo

#### Scenario: Exclusão de região remove os vínculos dos usuários
- **WHEN** uma região com usuários vinculados é excluída
- **THEN** os vínculos `usuarioRegiao` dessa região são removidos e os usuários continuam existindo

### Requirement: Substituição das regiões de um usuário

O sistema SHALL permitir substituir as regiões vinculadas a um usuário por meio de `PATCH /users/:id/regioes`, recebendo a lista completa de `regiaoIds`. A operação SHALL substituir os vínculos existentes pelos informados, de forma transacional, e SHALL responder 404 quando o usuário ou alguma região não existir.

#### Scenario: Substituição bem-sucedida
- **WHEN** um usuário autorizado envia `PATCH /users/:id/regioes` com `regiaoIds` válidos para um usuário existente
- **THEN** o sistema remove os vínculos anteriores e cria exatamente os vínculos informados, respondendo com sucesso

#### Scenario: Lista vazia remove todas as regiões
- **WHEN** um usuário autorizado envia `PATCH /users/:id/regioes` com `regiaoIds` vazio
- **THEN** o sistema remove todos os vínculos de região do usuário

#### Scenario: Usuário inexistente
- **WHEN** um usuário autorizado envia `PATCH /users/:id/regioes` com um id de usuário inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Usuário' não foi encontrado.` e `statusCode` 404, sem criar vínculos

#### Scenario: Região inexistente
- **WHEN** o payload informa um `regiaoId` que não existe
- **THEN** o sistema responde 404 com `message` `O registro de 'Região' não foi encontrado: <ids>.` e `statusCode` 404, sem criar ou remover vínculos

#### Scenario: Payload inválido
- **WHEN** `regiaoIds` não é um array de inteiros positivos únicos
- **THEN** o sistema responde 400 com `error` `Bad Request` e `statusCode` 400, sem alterar os vínculos

### Requirement: Permissão de gestão das regiões do usuário

O sistema SHALL exigir autenticação e permissão de atualização sobre o recurso `user` para processar `PATCH /users/:id/regioes`; sem token ou sem permissão, o sistema SHALL rejeitar a operação sem alterar os vínculos.

#### Scenario: Gestão sem autenticação
- **WHEN** `PATCH /users/:id/regioes` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Gestão por usuário sem permissão
- **WHEN** um usuário autenticado sem permissão de atualização sobre `user` chama `PATCH /users/:id/regioes`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update user`, `error` `Forbidden` e `statusCode` 403, sem alterar os vínculos
