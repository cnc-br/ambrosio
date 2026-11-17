# Spec Delta

## ADDED Requirements

### Requirement: Vínculo usuário–setor

O sistema SHALL manter o vínculo entre usuários e setores em `usuarioSetor`, com um registro por par usuário–setor e sem duplicidade. Ao excluir um usuário, o sistema SHALL remover os vínculos `usuarioSetor` dele, preservando os setores. Ao excluir um setor, o sistema SHALL remover os vínculos dos usuários com esse setor, preservando os usuários.

#### Scenario: Vínculo criado sem duplicidade
- **WHEN** um usuário é vinculado ao mesmo setor mais de uma vez
- **THEN** o sistema mantém apenas um vínculo entre esse usuário e esse setor

#### Scenario: Exclusão de usuário remove os vínculos de setor
- **WHEN** um usuário com vínculos em `usuarioSetor` é excluído
- **THEN** os vínculos dele são removidos e os setores continuam existindo

#### Scenario: Exclusão de setor remove os vínculos dos usuários
- **WHEN** um setor com usuários vinculados é excluído
- **THEN** os vínculos `usuarioSetor` desse setor são removidos e os usuários continuam existindo

### Requirement: Substituição dos setores de um usuário

O sistema SHALL permitir substituir os setores vinculados a um usuário por meio de `PATCH /users/:id/setores`, recebendo a lista completa de `setorIds`. A operação SHALL substituir os vínculos existentes pelos informados, de forma transacional, e SHALL responder 404 quando o usuário não existir.

#### Scenario: Substituição bem-sucedida
- **WHEN** um usuário autorizado envia `PATCH /users/:id/setores` com `setorIds` válidos para um usuário existente
- **THEN** o sistema remove os vínculos anteriores e cria exatamente os vínculos informados, respondendo com sucesso

#### Scenario: Lista vazia remove todos os setores
- **WHEN** um usuário autorizado envia `PATCH /users/:id/setores` com `setorIds` vazio
- **THEN** o sistema remove todos os vínculos de setor do usuário

#### Scenario: Usuário inexistente
- **WHEN** um usuário autorizado envia `PATCH /users/:id/setores` com um id de usuário inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Usuário' não foi encontrado.` e `statusCode` 404, sem criar vínculos

#### Scenario: Setor inexistente
- **WHEN** o payload informa um `setorId` que não existe
- **THEN** o sistema rejeita a operação e não deixa vínculos parciais

#### Scenario: Payload inválido
- **WHEN** `setorIds` não é um array de inteiros positivos únicos
- **THEN** o sistema responde 400 com `error` `Bad Request` e `statusCode` 400, sem alterar os vínculos

### Requirement: Permissão de gestão dos setores do usuário

O sistema SHALL exigir autenticação e permissão de atualização sobre o recurso `user` para processar `PATCH /users/:id/setores`; sem token ou sem permissão, o sistema SHALL rejeitar a operação.

#### Scenario: Gestão sem autenticação
- **WHEN** `PATCH /users/:id/setores` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Gestão por usuário sem permissão
- **WHEN** um usuário autenticado sem permissão de atualização sobre `user` chama `PATCH /users/:id/setores`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update user`, `error` `Forbidden` e `statusCode` 403, sem alterar os vínculos
