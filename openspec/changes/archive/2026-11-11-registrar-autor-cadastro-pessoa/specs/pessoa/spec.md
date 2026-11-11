# Spec Delta

## ADDED Requirements

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
