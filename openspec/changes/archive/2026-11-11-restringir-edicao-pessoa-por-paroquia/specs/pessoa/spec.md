# Spec Delta

## ADDED Requirements

### Requirement: Leitura de todas as pessoas por SECRETARIA_CNC

O sistema SHALL permitir que um usuário `SECRETARIA_CNC` leia todas as pessoas, tanto na listagem quanto no detalhe, sem filtro por paróquia. A leitura de `pessoa` pelos demais perfis permanece regida pelas permissões atuais.

#### Scenario: SECRETARIA_CNC lista todas as pessoas

- **WHEN** um usuário `SECRETARIA_CNC` autenticado chama `GET /pessoa`
- **THEN** a resposta contém pessoas de todas as paróquias, sem restrição por paróquia

#### Scenario: SECRETARIA_CNC detalha uma pessoa de outra paróquia

- **WHEN** um usuário `SECRETARIA_CNC` autenticado chama `GET /pessoa/:id` para uma pessoa de uma paróquia não vinculada a ele
- **THEN** o sistema responde 200 com os dados da pessoa

### Requirement: Criação de casal no escopo de paróquia

O sistema SHALL permitir que `SECRETARIA_CNC` crie um casal por `POST /pessoa/casal` apenas quando as duas pessoas (`pessoaId` e `conjugueId`) estiverem no escopo do usuário. `ADMIN` SHALL manter a criação irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas no escopo

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /pessoa/casal` com `pessoaId` e `conjugueId` de pessoas com vínculo ativo em comunidades da paróquia X
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa sem vínculo ativo

- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /pessoa/casal` com uma das pessoas sem vínculo ativo com comunidade
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa fora do escopo

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /pessoa/casal` com uma pessoa de vínculo ativo na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas fora do escopo

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /pessoa/casal` com as duas pessoas de vínculo ativo na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: ADMIN cria casal

- **WHEN** um usuário `ADMIN` autenticado envia `POST /pessoa/casal` com duas pessoas existentes
- **THEN** o sistema responde 201 e o casal é criado, sem restrição de escopo

#### Scenario: Pessoa inexistente no casal

- **WHEN** um usuário com permissão envia `POST /pessoa/casal` com um `pessoaId` ou `conjugueId` inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, sem criar o casal

#### Scenario: Perfil sem permissão de criação de casal

- **WHEN** um usuário autenticado sem permissão de criação de pessoa envia `POST /pessoa/casal`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para create pessoa`, `error` `Forbidden` e `statusCode` 403, sem criar o casal

### Requirement: Leitura de cônjuges no escopo de paróquia

O sistema SHALL permitir que `SECRETARIA_CNC` liste cônjuges disponíveis por `GET /pessoa/conjugue` apenas para pessoas nas suas paróquias. `ADMIN` SHALL listar todos os cônjuges disponíveis. `NAO_IDENTIFICADO` SHALL ser rejeitado com 403.

#### Scenario: SECRETARIA_CNC lista cônjuges da própria paróquia

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém apenas pessoas casadas sem cônjuge cujo vínculo ativo está na paróquia X

#### Scenario: SECRETARIA_CNC sem paróquias lista cônjuges

- **WHEN** um usuário `SECRETARIA_CNC` sem vínculos em `usuarioParoquia` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta é 200 com lista vazia

#### Scenario: ADMIN lista todos os cônjuges

- **WHEN** um usuário `ADMIN` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém cônjuges disponíveis de todas as paróquias, sem restrição

#### Scenario: Perfil sem permissão de leitura de cônjuges

- **WHEN** um usuário sem permissão de leitura de pessoa chama `GET /pessoa/conjugue?sexo=M`
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403

## MODIFIED Requirements

### Requirement: Autorização da atualização de pessoa

O sistema SHALL autorizar a atualização de pessoa para `ADMIN` em qualquer pessoa. Para `SECRETARIA_CNC`, a atualização SHALL ser permitida apenas quando a pessoa não tiver vínculo ativo com comunidade ou quando ao menos um vínculo ativo estiver em uma paróquia do usuário. Os demais perfis SHALL ser rejeitados com 403.

#### Scenario: SECRETARIA_CNC atualiza pessoa

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa com vínculo ativo em uma comunidade da paróquia X
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa sem vínculo com comunidade

- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculo apenas encerrado

- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa cujo único vínculo com comunidade tem `dataSaida` preenchida
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculo ativo em outra paróquia

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa cujo vínculo ativo está em uma paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculos ativos em paróquias próprias e de terceiros

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa com vínculos ativos em X e em Y
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: ADMIN atualiza pessoa

- **WHEN** um usuário `ADMIN` autenticado envia `PATCH /pessoa/:id` para uma pessoa existente com payload válido
- **THEN** o sistema responde 200 e a pessoa é atualizada, sem restrição de escopo

#### Scenario: Perfil sem permissão de atualização

- **WHEN** um usuário autenticado sem permissão de atualização envia `PATCH /pessoa/:id` com payload válido
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update pessoa`, `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa
