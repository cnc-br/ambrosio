# Spec Delta

## MODIFIED Requirements

### Requirement: Autorização da atualização de pessoa

O sistema SHALL autorizar a atualização de pessoa para `ADMIN` em qualquer pessoa. Para `SECRETARIA_PAROQUIA`, a atualização SHALL ser permitida quando a pessoa não tiver vínculo ativo com comunidade ou quando ao menos um vínculo ativo estiver em uma paróquia vinculada ao usuário. Para `SECRETARIA_CNC`, SHALL valer a mesma regra considerando as paróquias dos setores das regiões do usuário. Os demais perfis SHALL ser rejeitados com 403.

#### Scenario: SECRETARIA_CNC atualiza pessoa
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R envia `PATCH /pessoa/:id` para uma pessoa com vínculo ativo em uma comunidade de paróquia cujo setor pertence a R
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa sem vínculo com comunidade
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculo apenas encerrado
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa cujo único vínculo com comunidade tem `dataSaida` preenchida
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculo ativo em outra paróquia
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R envia `PATCH /pessoa/:id` para uma pessoa cujo vínculo ativo está em uma paróquia de outra região
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculos ativos em paróquias próprias e de terceiros
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa com vínculos ativos em uma paróquia da sua região e em uma paróquia de outra região
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: ADMIN atualiza pessoa
- **WHEN** um usuário `ADMIN` autenticado envia `PATCH /pessoa/:id` para uma pessoa existente com payload válido
- **THEN** o sistema responde 200 e a pessoa é atualizada, sem restrição de escopo

#### Scenario: Perfil sem permissão de atualização
- **WHEN** um usuário autenticado sem permissão de atualização envia `PATCH /pessoa/:id` com payload válido
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update pessoa`, `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa da própria paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa com vínculo ativo em uma comunidade da paróquia X
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa de outra paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa cujo vínculo ativo está em uma paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

### Requirement: Cadastro de pessoa vinculada a uma comunidade

O sistema SHALL aceitar, em `POST /pessoa`, o query param opcional `comunidadeId` (inteiro). Quando informado, o sistema SHALL validar **antes de qualquer criação** que a comunidade existe e está dentro do escopo de atualização do usuário — paróquias vinculadas em `usuarioParoquia` para o `SECRETARIA_PAROQUIA` ou paróquias das regiões do `SECRETARIA_CNC` — e somente em caso de sucesso SHALL criar a pessoa e o vínculo dela com a comunidade.

#### Scenario: Vínculo com comunidade dentro do escopo

- **WHEN** um usuário com permissão de cadastro de pessoa envia `POST /pessoa?comunidadeId=N` para uma comunidade cuja paróquia está no escopo do usuário
- **THEN** o sistema responde `201` com a pessoa criada
- **AND** o vínculo entre a pessoa criada e a comunidade de id `N` DEVE ser criado

#### Scenario: Comunidade inexistente

- **WHEN** um usuário envia `POST /pessoa?comunidadeId=N` com uma comunidade que não existe
- **THEN** o sistema responde `404` com `statusCode` 404
- **AND** nenhuma pessoa DEVE ser criada (nem na API externa, nem localmente)

#### Scenario: Comunidade fora do escopo do usuário

- **WHEN** um usuário com permissão de cadastro de pessoa envia `POST /pessoa?comunidadeId=N` para uma comunidade cuja paróquia está fora do escopo do usuário
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

### Requirement: Criação de casal no escopo de paróquia

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` crie um casal por `POST /pessoa/casal` apenas quando as duas pessoas estiverem no escopo das suas paróquias, e que `SECRETARIA_CNC` faça o mesmo no escopo das paróquias das suas regiões. `ADMIN` SHALL manter a criação irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas no escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R envia `POST /pessoa/casal` com pessoas de vínculo ativo em comunidades de paróquias da região R
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa sem vínculo ativo
- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /pessoa/casal` com uma das pessoas sem vínculo ativo com comunidade
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R envia `POST /pessoa/casal` com uma pessoa de vínculo ativo em paróquia de outra região
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R envia `POST /pessoa/casal` com as duas pessoas de vínculo ativo em paróquias de outra região
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

#### Scenario: SECRETARIA_PAROQUIA cria casal com as duas pessoas no escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `POST /pessoa/casal` com pessoas de vínculo ativo em comunidades da paróquia X
- **THEN** o sistema responde 201 e o casal é criado

### Requirement: Leitura de cônjuges no escopo de paróquia

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` liste cônjuges por `GET /pessoa/conjugue` apenas para pessoas nas suas paróquias, e que `SECRETARIA_CNC` liste os cônjuges das paróquias das suas regiões. `ADMIN` SHALL listar todos os cônjuges disponíveis. `NAO_IDENTIFICADO` SHALL ser rejeitado com 403.

#### Scenario: SECRETARIA_CNC lista cônjuges da própria paróquia
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à região R chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém apenas pessoas casadas sem cônjuge cujo vínculo ativo está em paróquia de um setor da região R

#### Scenario: SECRETARIA_CNC sem paróquias lista cônjuges
- **WHEN** um usuário `SECRETARIA_CNC` sem vínculos em `usuarioRegiao` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta é 200 com lista vazia

#### Scenario: ADMIN lista todos os cônjuges
- **WHEN** um usuário `ADMIN` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém cônjuges disponíveis de todas as paróquias, sem restrição

#### Scenario: Perfil sem permissão de leitura de cônjuges
- **WHEN** um usuário sem permissão de leitura de pessoa chama `GET /pessoa/conjugue?sexo=M`
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403

#### Scenario: SECRETARIA_PAROQUIA lista cônjuges da própria paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém apenas pessoas casadas sem cônjuge cujo vínculo ativo está na paróquia X
