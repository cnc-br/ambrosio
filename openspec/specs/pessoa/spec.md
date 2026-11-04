# Pessoa Specification

## Purpose

Define o cadastro e a atualização de pessoas pela API, incluindo os contratos de `POST /pessoa` e `PATCH /pessoa/:id` e as regras de autorização por perfil que determinam quem pode criar e atualizar uma pessoa.

## Requirements

### Requirement: Criação de pessoa

O sistema SHALL permitir criar uma pessoa por meio de `POST /pessoa` com um payload válido contendo `nome`, `nacionalidade` e `situacaoReligiosa`, retornando 201 com a pessoa criada e seus dados serializados.

#### Scenario: Criação com payload válido
- **WHEN** um usuário autenticado com permissão de criação envia `POST /pessoa` com `nome`, `nacionalidade` e `situacaoReligiosa` válidos
- **THEN** o sistema responde 201 e o corpo contém a pessoa criada com `id` e os dados de identificação retornados, como `nome` e `cpf`

#### Scenario: Criação com situação religiosa inexistente
- **WHEN** o payload informa uma `situacaoReligiosa` cujo id não existe
- **THEN** o sistema responde 404 com `message` `O registro de 'SituacaoReligiosa' não foi encontrado.` e `statusCode` 404, sem criar a pessoa

#### Scenario: Criação com CPF inválido
- **WHEN** o payload informa um CPF com formato ou dígitos verificadores inválidos
- **THEN** o sistema responde 400 sem consultar a pessoa na API externa nem criar a pessoa

#### Scenario: Criação com CPF já cadastrado
- **WHEN** o payload informa um `cpf` que já pertence a uma pessoa cadastrada
- **THEN** o sistema responde 409 com a mensagem de CPF já registrado, sem criar a pessoa

### Requirement: Autorização do cadastro de pessoa

O sistema SHALL autorizar a criação de pessoa para os perfis `ADMIN` e `SECRETARIA_CNC`, inclusive quando o `SECRETARIA_CNC` não possui vínculo com nenhuma paróquia. Os demais perfis SHALL ser bloqueados.

#### Scenario: SECRETARIA_CNC cria pessoa
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada

#### Scenario: SECRETARIA_CNC sem paróquia cria pessoa
- **WHEN** um usuário `SECRETARIA_CNC` sem vínculos em `usuarioParoquia` envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada, pois a permissão de cadastro não é restrita por paróquia

#### Scenario: ADMIN cria pessoa
- **WHEN** um usuário `ADMIN` autenticado envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada

### Requirement: Rejeição do cadastro sem autenticação

O sistema SHALL exigir autenticação para processar `POST /pessoa` e SHALL rejeitar a requisição sem token com 401.

#### Scenario: Requisição sem token
- **WHEN** `POST /pessoa` é chamado sem o cabeçalho `Authorization`
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

### Requirement: Rejeição do cadastro por perfil sem permissão

O sistema SHALL rejeitar com 403 a tentativa de criar pessoa por um usuário autenticado cujo perfil não possui permissão de criação sobre `pessoa`.

#### Scenario: Perfil sem permissão de criação
- **WHEN** um usuário autenticado sem permissão de criação envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para create pessoa`, `error` `Forbidden` e `statusCode` 403, sem criar a pessoa

### Requirement: Atualização de pessoa

O sistema SHALL permitir atualizar uma pessoa existente por meio de `PATCH /pessoa/:id` com um payload parcial, retornando 200 com os dados da pessoa atualizada. Quando o id não existir, o sistema SHALL responder 404 sem atualizar nada.

#### Scenario: Atualização bem-sucedida
- **WHEN** um usuário autenticado com permissão de atualização envia `PATCH /pessoa/:id` para uma pessoa existente com um payload válido
- **THEN** o sistema responde 200 e o corpo contém a pessoa atualizada com o `id` informado

#### Scenario: Atualização de pessoa inexistente
- **WHEN** um usuário com permissão de atualização envia `PATCH /pessoa/999999` com um payload válido
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404

### Requirement: Autorização da atualização de pessoa

O sistema SHALL autorizar a atualização de pessoa para os perfis `ADMIN` e `SECRETARIA_CNC`, e SHALL rejeitar com 403 a tentativa de qualquer outro perfil autenticado.

#### Scenario: SECRETARIA_CNC atualiza pessoa
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `PATCH /pessoa/:id` para uma pessoa existente com payload válido
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: ADMIN atualiza pessoa
- **WHEN** um usuário `ADMIN` autenticado envia `PATCH /pessoa/:id` para uma pessoa existente com payload válido
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: Perfil sem permissão de atualização
- **WHEN** um usuário autenticado sem permissão de atualização envia `PATCH /pessoa/:id` com payload válido
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update pessoa`, `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

### Requirement: Rejeição da atualização sem autenticação

O sistema SHALL exigir autenticação para processar `PATCH /pessoa/:id` e SHALL rejeitar a requisição sem token com 401.

#### Scenario: Requisição de atualização sem token
- **WHEN** `PATCH /pessoa/:id` é chamado sem o cabeçalho `Authorization`
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401
