# Spec Delta

## MODIFIED Requirements

### Requirement: Escopo de paróquia na criação de contato

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` crie contato por `POST /pessoa/:id/contato` apenas para pessoa no escopo das suas paróquias, e que `SECRETARIA_CNC` crie apenas para pessoa no escopo dos seus setores. `ADMIN` SHALL manter a criação irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: Criação de contato em pessoa do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `POST /pessoa/:id/contato` para uma pessoa com vínculo ativo em comunidade da paróquia X
- **THEN** o sistema responde 201 e o contato é criado

#### Scenario: Criação de contato em pessoa sem vínculo ativo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` chama `POST /pessoa/:id/contato` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 201 e o contato é criado

#### Scenario: Criação de contato em pessoa fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `POST /pessoa/:id/contato` para uma pessoa cujo vínculo ativo está na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o contato

#### Scenario: SECRETARIA_CNC cria contato em pessoa do seu setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S chama `POST /pessoa/:id/contato` para uma pessoa com vínculo ativo em comunidade de paróquia do setor S
- **THEN** o sistema responde 201 e o contato é criado

#### Scenario: SECRETARIA_CNC cria contato em pessoa de outro setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S chama `POST /pessoa/:id/contato` para uma pessoa cujo vínculo ativo está em paróquia de outro setor
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o contato

#### Scenario: ADMIN cria contato
- **WHEN** um usuário `ADMIN` autenticado chama `POST /pessoa/:id/contato` para uma pessoa existente
- **THEN** o sistema responde 201 e o contato é criado, sem restrição de escopo

#### Scenario: Pessoa inexistente na criação de contato
- **WHEN** um usuário com permissão chama `POST /pessoa/:id/contato` com um id de pessoa inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, sem criar o contato

### Requirement: Escopo de paróquia na atualização de contato

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` atualize contato por `PATCH /pessoa/:id/contato/:contatoId` apenas para pessoa no escopo das suas paróquias, e que `SECRETARIA_CNC` atualize apenas para pessoa no escopo dos seus setores. `ADMIN` SHALL manter a atualização irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: Atualização de contato em pessoa do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa com vínculo ativo em comunidade da paróquia X
- **THEN** o sistema responde 200 e o contato é atualizado

#### Scenario: Atualização de contato em pessoa sem vínculo ativo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 200 e o contato é atualizado

#### Scenario: Atualização de contato em pessoa fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa cujo vínculo ativo está na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar o contato

#### Scenario: SECRETARIA_CNC atualiza contato em pessoa do seu setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa com vínculo ativo em comunidade de paróquia do setor S
- **THEN** o sistema responde 200 e o contato é atualizado

#### Scenario: SECRETARIA_CNC atualiza contato em pessoa de outro setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa cujo vínculo ativo está em paróquia de outro setor
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar o contato

#### Scenario: ADMIN atualiza contato
- **WHEN** um usuário `ADMIN` autenticado chama `PATCH /pessoa/:id/contato/:contatoId` para uma pessoa existente
- **THEN** o sistema responde 200 e o contato é atualizado, sem restrição de escopo

#### Scenario: Pessoa inexistente na atualização de contato
- **WHEN** um usuário com permissão chama `PATCH /pessoa/:id/contato/:contatoId` com um id de pessoa inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, sem chamar a São Pedro
