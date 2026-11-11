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

### Requirement: Cadastro de pessoa vinculada a uma comunidade

O sistema DEVE aceitar, em `POST /pessoa`, o query param opcional `comunidadeId` (inteiro). Quando informado, o sistema DEVE validar **antes de qualquer criação** que a comunidade existe e está dentro do escopo de atualização do usuário (paróquias vinculadas em `usuarioParoquia`), e somente em caso de sucesso DEVE criar a pessoa e o vínculo dela com a comunidade.

#### Scenario: Vínculo com comunidade dentro do escopo

- **WHEN** um usuário com permissão de cadastro de pessoa envia `POST /pessoa?comunidadeId=N` para uma comunidade cuja paróquia está vinculada a ele
- **THEN** o sistema responde `201` com a pessoa criada
- **AND** o vínculo entre a pessoa criada e a comunidade de id `N` DEVE ser criado

#### Scenario: Comunidade inexistente

- **WHEN** um usuário envia `POST /pessoa?comunidadeId=N` com uma comunidade que não existe
- **THEN** o sistema responde `404` com `statusCode` 404
- **AND** nenhuma pessoa DEVE ser criada (nem na API externa, nem localmente)

#### Scenario: Comunidade fora do escopo do usuário

- **WHEN** um usuário com permissão de cadastro de pessoa envia `POST /pessoa?comunidadeId=N` para uma comunidade cuja paróquia não está vinculada a ele
- **THEN** o sistema responde `403` com `error` `Forbidden` e `statusCode` 403
- **AND** nenhuma pessoa DEVE ser criada
- **AND** nenhum vínculo DEVE ser criado

#### Scenario: Cadastro sem comunidadeId

- **WHEN** um usuário envia `POST /pessoa` sem o query param `comunidadeId`
- **THEN** o sistema responde `201` com a pessoa criada, sem criar vínculo com comunidade
- **AND** o comportamento é idêntico ao cadastro atual

#### Scenario: comunidadeId não numérico

- **WHEN** um usuário envia `POST /pessoa?comunidadeId=abc`
- **THEN** o sistema responde `406` com `statusCode` 406
- **AND** nenhuma pessoa DEVE ser criada

### Requirement: Integridade do vínculo após a criação da pessoa

Quando o `comunidadeId` é validado com sucesso e a pessoa é criada, se a criação do vínculo com a comunidade falhar o sistema DEVE desfazer o cadastro local da pessoa recém-criada e repassar o erro, NÃO DEIXANDO pessoa cadastrada sem o vínculo solicitado.

#### Scenario: Falha na criação do vínculo após a pessoa criada

- **WHEN** a pessoa é criada com sucesso, mas a criação do vínculo `comunidadePessoa` falha
- **THEN** o cadastro local da pessoa recém-criada DEVE ser removido
- **AND** o erro DEVE ser propagado ao chamador
- **AND** nenhum vínculo parcial DEVE permanecer

#### Scenario: Vínculo criado com sucesso após a pessoa

- **WHEN** após a criação da pessoa o vínculo `comunidadePessoa` é criado com sucesso
- **THEN** a pessoa DEVE permanecer cadastrada
- **AND** o vínculo DEVE existir entre a pessoa e a comunidade informada

### Requirement: Registro da autoria no cadastro de pessoa

O sistema SHALL registrar, ao criar uma pessoa por `POST /pessoa`, o id do usuário autenticado que executou o cadastro em `cadastradoPorId` e em `atualizadoPorId`. A autoria SHALL ser obtida do contexto autenticado da requisição, nunca do payload, e SHALL ser armazenada como `NULL` apenas quando não houver usuário identificado no registro legado.

#### Scenario: Cadastro registra o usuário autenticado
- **WHEN** um usuário autenticado com permissão envia `POST /pessoa` com um payload válido
- **THEN** a pessoa criada é persistida com `cadastradoPorId` e `atualizadoPorId` iguais ao id do usuário autenticado

#### Scenario: Autoria não pode ser forjada pelo payload
- **WHEN** o payload de `POST /pessoa` contém `cadastradoPorId` ou `atualizadoPorId` com outro valor
- **THEN** o sistema ignora os valores do payload e persiste o id do usuário autenticado

### Requirement: Registro da autoria na atualização de pessoa

O sistema SHALL registrar, após uma atualização bem-sucedida por `PATCH /pessoa/:id`, o id do usuário autenticado em `atualizadoPorId`. Uma atualização que falhe por pessoa inexistente, falta de permissão ou erro na API externa SHALL NOT alterar a autoria.

#### Scenario: Atualização registra o usuário autenticado
- **WHEN** um usuário autenticado com permissão envia `PATCH /pessoa/:id` para uma pessoa existente com um payload válido
- **THEN** a pessoa atualizada passa a ter `atualizadoPorId` igual ao id do usuário autenticado

#### Scenario: Atualização malsucedida preserva a autoria anterior
- **WHEN** um `PATCH /pessoa/:id` falha por pessoa inexistente, falta de permissão ou erro na atualização externa
- **THEN** `atualizadoPorId` permanece com o valor anterior

### Requirement: Campos de auditoria não expostos nas respostas

O sistema SHALL NOT expor `cadastradoPorId` nem `atualizadoPorId` nos payloads de resposta dos endpoints de pessoa, mantendo o contrato de resposta atual.

#### Scenario: Criação não expõe auditoria
- **WHEN** `POST /pessoa` cria uma pessoa com sucesso
- **THEN** o corpo da resposta não contém `cadastradoPorId` nem `atualizadoPorId`

#### Scenario: Consulta e atualização não expõem auditoria
- **WHEN** uma pessoa é consultada por `GET /pessoa/:id` ou atualizada por `PATCH /pessoa/:id`
- **THEN** o corpo da resposta não contém `cadastradoPorId` nem `atualizadoPorId`
