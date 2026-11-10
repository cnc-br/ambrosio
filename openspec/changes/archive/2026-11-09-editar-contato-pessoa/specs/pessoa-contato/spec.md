# Spec Delta

## ADDED Requirements

### Requirement: Atualização de contato de uma pessoa

O sistema SHALL permitir atualizar um contato existente de uma pessoa por meio da rota `PATCH /pessoa/:id/contato/:contatoId`, onde `:id` é o id local da pessoa e `:contatoId` é o id do contato na API externa São Pedro, encaminhando o payload parcial à São Pedro (sem persistência local) e retornando 200 com o contato atualizado em camelCase.

#### Scenario: Atualização bem-sucedida com todos os campos
- **WHEN** um usuário autenticado e com permissão de atualização chama `PATCH /pessoa/:id/contato/:contatoId` com um payload contendo `tipoTelefone`, `telefone`, `email`, `observacao` e `contatoPrincipal` para uma pessoa existente e um contato existente na São Pedro
- **THEN** o sistema encaminha os dados à São Pedro (usando somente o `:contatoId` externo na rota `/api/contatos/:contatoId/`) e responde 200 retornando o contato atualizado com os valores enviados em camelCase

#### Scenario: Atualização parcial
- **WHEN** o payload contém apenas alguns campos (por exemplo, somente `telefone` e `email`)
- **THEN** apenas os campos informados são encaminhados à São Pedro e o sistema responde 200 retornando o contato atualizado, preservando os demais campos

#### Scenario: Pessoa inexistente na atualização
- **WHEN** um usuário com permissão chama `PATCH /pessoa/:id/contato/:contatoId` com um id de pessoa inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, sem chamar a São Pedro

#### Scenario: Contato inexistente na São Pedro
- **WHEN** a pessoa existe, mas o `:contatoId` externo não corresponde a um contato existente na São Pedro
- **THEN** o sistema propaga o 404 retornado pela API São Pedro e nenhum contato é atualizado

#### Scenario: Payload de atualização inválido
- **WHEN** o payload contém um campo que viola as regras de validação (por exemplo, `email` inválido, `tipoTelefone` fora de `CELULAR`/`RESIDENCIAL`/`COMERCIAL` ou `contatoPrincipal` com tipo inválido)
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo, sem chamar a São Pedro

### Requirement: Autenticação e permissão na atualização de contato

O sistema SHALL exigir autenticação e permissão de atualização sobre o recurso `pessoa` para processar `PATCH /pessoa/:id/contato/:contatoId`; sem token ou sem permissão, o sistema SHALL rejeitar a atualização.

#### Scenario: Atualização sem autenticação
- **WHEN** `PATCH /pessoa/:id/contato/:contatoId` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Atualização por usuário autenticado sem permissão
- **WHEN** um usuário autenticado sem permissão de atualização sobre `pessoa` chama `PATCH /pessoa/:id/contato/:contatoId`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update pessoa`, `error` `Forbidden` e `statusCode` 403