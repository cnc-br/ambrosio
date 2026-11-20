# Spec Delta

## ADDED Requirements

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
