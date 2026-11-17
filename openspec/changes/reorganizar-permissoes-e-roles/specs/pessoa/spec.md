# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Leitura de todas as pessoas por SECRETARIA_CNC`
- TO: `### Requirement: Leitura de todas as pessoas pelas secretarias`

## REMOVED Requirements

### Requirement: Autorização do cadastro de pessoa

**Reason**: O cadastro deixa de ser descrito apenas para `SECRETARIA_CNC` e passa a valer também para `SECRETARIA_PAROQUIA`, que herda o comportamento local anterior.

**Migration**: Usar o requisito `Autorização do cadastro de pessoa pelas secretarias`, que mantém as mesmas capacidades e cenários com os dois perfis.

### Requirement: Autorização da atualização de pessoa

**Reason**: A atualização passa a distinguir o escopo por paróquia do `SECRETARIA_PAROQUIA` e o escopo por setor do `SECRETARIA_CNC`.

**Migration**: Usar o requisito `Autorização da atualização de pessoa por paróquia e setor`.

### Requirement: Criação de casal no escopo de paróquia

**Reason**: A criação de casal passa a ser permitida aos dois perfis de secretaria, cada um com seu escopo.

**Migration**: Usar o requisito `Criação de casal no escopo de paróquia e setor`.

### Requirement: Leitura de cônjuges no escopo de paróquia

**Reason**: A leitura de cônjuges passa a ser permitida aos dois perfis de secretaria, cada um com seu escopo.

**Migration**: Usar o requisito `Leitura de cônjuges no escopo de paróquia e setor`.

## MODIFIED Requirements

### Requirement: Cadastro de pessoa vinculada a uma comunidade

O sistema SHALL aceitar, em `POST /pessoa`, o query param opcional `comunidadeId` (inteiro). Quando informado, o sistema SHALL validar **antes de qualquer criação** que a comunidade existe e está dentro do escopo de atualização do usuário — paróquias vinculadas em `usuarioParoquia` para `SECRETARIA_PAROQUIA` e setores vinculados em `usuarioSetor` para `SECRETARIA_CNC` —, e somente em caso de sucesso SHALL criar a pessoa e o vínculo dela com a comunidade.

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

#### Scenario: SECRETARIA_CNC vincula pessoa a comunidade do seu setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /pessoa?comunidadeId=N` para uma comunidade de paróquia do setor S
- **THEN** o sistema responde `201` com a pessoa criada e o vínculo com a comunidade

#### Scenario: SECRETARIA_CNC vincula pessoa a comunidade de outro setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /pessoa?comunidadeId=N` para uma comunidade de paróquia de outro setor
- **THEN** o sistema responde `403` com `error` `Forbidden` e `statusCode` 403, sem criar a pessoa nem o vínculo

#### Scenario: Cadastro sem comunidadeId

- **WHEN** um usuário envia `POST /pessoa` sem o query param `comunidadeId`
- **THEN** o sistema responde `201` com a pessoa criada, sem criar vínculo com comunidade
- **AND** o comportamento é idêntico ao cadastro atual

#### Scenario: comunidadeId não numérico

- **WHEN** um usuário envia `POST /pessoa?comunidadeId=abc`
- **THEN** o sistema responde `406` com `statusCode` 406
- **AND** nenhuma pessoa DEVE ser criada

### Requirement: Leitura de todas as pessoas pelas secretarias

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC` leiam todas as pessoas, tanto na listagem quanto no detalhe, sem filtro por paróquia ou setor. A leitura de `pessoa` pelos demais perfis permanece regida pelas permissões atuais.

#### Scenario: SECRETARIA_PAROQUIA lista todas as pessoas
- **WHEN** um usuário `SECRETARIA_PAROQUIA` autenticado chama `GET /pessoa`
- **THEN** a resposta contém pessoas de todas as paróquias, sem restrição por paróquia

#### Scenario: SECRETARIA_CNC lista todas as pessoas
- **WHEN** um usuário `SECRETARIA_CNC` autenticado chama `GET /pessoa`
- **THEN** a resposta contém pessoas de todas as paróquias, sem restrição por setor

#### Scenario: SECRETARIA_PAROQUIA detalha uma pessoa de outra paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` autenticado chama `GET /pessoa/:id` para uma pessoa de uma paróquia não vinculada a ele
- **THEN** o sistema responde 200 com os dados da pessoa

#### Scenario: SECRETARIA_PAROQUIA detalha uma pessoa de outra paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` autenticado chama `GET /pessoa/:id` para uma pessoa de uma paróquia não vinculada a ele
- **THEN** o sistema responde 200 com os dados da pessoa

#### Scenario: SECRETARIA_CNC detalha uma pessoa de outra paróquia
- **WHEN** um usuário `SECRETARIA_CNC` autenticado chama `GET /pessoa/:id` para uma pessoa de uma paróquia de setor não vinculado a ele
- **THEN** o sistema responde 200 com os dados da pessoa

## ADDED Requirements

### Requirement: Autorização do cadastro de pessoa pelas secretarias

O sistema SHALL autorizar a criação de pessoa para os perfis `ADMIN`, `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC`, inclusive quando a secretaria não possui vínculo com nenhuma paróquia ou setor. Os demais perfis SHALL ser bloqueados.

#### Scenario: SECRETARIA_PAROQUIA cria pessoa
- **WHEN** um usuário `SECRETARIA_PAROQUIA` autenticado envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada

#### Scenario: SECRETARIA_PAROQUIA sem paróquia cria pessoa
- **WHEN** um usuário `SECRETARIA_PAROQUIA` sem vínculos em `usuarioParoquia` envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada, pois a permissão de cadastro não é restrita por paróquia

#### Scenario: SECRETARIA_CNC cria pessoa
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada, sem restrição de setor para o cadastro sem comunidade

#### Scenario: ADMIN cria pessoa
- **WHEN** um usuário `ADMIN` autenticado envia `POST /pessoa` com payload válido
- **THEN** o sistema responde 201 e a pessoa é criada

### Requirement: Autorização da atualização de pessoa por paróquia e setor

O sistema SHALL autorizar a atualização de pessoa para `ADMIN` em qualquer pessoa. Para `SECRETARIA_PAROQUIA`, a atualização SHALL ser permitida apenas quando a pessoa não tiver vínculo ativo com comunidade ou quando ao menos um vínculo ativo estiver em uma paróquia do usuário. Para `SECRETARIA_CNC`, a mesma regra SHALL usar os setores vinculados ao usuário. Os demais perfis SHALL ser rejeitados com 403.

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa com vínculo ativo em uma comunidade da paróquia X
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa sem vínculo com comunidade
- **WHEN** um usuário `SECRETARIA_PAROQUIA` envia `PATCH /pessoa/:id` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa com vínculo apenas encerrado
- **WHEN** um usuário `SECRETARIA_PAROQUIA` envia `PATCH /pessoa/:id` para uma pessoa cujo único vínculo com comunidade tem `dataSaida` preenchida
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa com vínculo ativo em outra paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa cujo vínculo ativo está em uma paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

#### Scenario: SECRETARIA_PAROQUIA atualiza pessoa com vínculos ativos em paróquias próprias e de terceiros
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `PATCH /pessoa/:id` para uma pessoa com vínculos ativos em X e em Y
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa de comunidade do seu setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `PATCH /pessoa/:id` para uma pessoa com vínculo ativo em uma comunidade de paróquia do setor S
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa sem vínculo com comunidade
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculo apenas encerrado
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /pessoa/:id` para uma pessoa cujo único vínculo com comunidade tem `dataSaida` preenchida
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: SECRETARIA_CNC atualiza pessoa de comunidade de outro setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `PATCH /pessoa/:id` para uma pessoa cujo vínculo ativo está em uma paróquia de outro setor
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

#### Scenario: SECRETARIA_CNC atualiza pessoa com vínculos ativos em setores próprios e de terceiros
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `PATCH /pessoa/:id` para uma pessoa com vínculos ativos em paróquias de S e de outro setor
- **THEN** o sistema responde 200 e a pessoa é atualizada

#### Scenario: ADMIN atualiza pessoa
- **WHEN** um usuário `ADMIN` autenticado envia `PATCH /pessoa/:id` para uma pessoa existente com payload válido
- **THEN** o sistema responde 200 e a pessoa é atualizada, sem restrição de escopo

#### Scenario: Perfil sem permissão de atualização
- **WHEN** um usuário autenticado sem permissão de atualização envia `PATCH /pessoa/:id` com payload válido
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para update pessoa`, `error` `Forbidden` e `statusCode` 403, sem atualizar a pessoa

### Requirement: Criação de casal no escopo de paróquia e setor

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC` criem um casal por `POST /pessoa/casal` apenas quando as duas pessoas (`pessoaId` e `conjugueId`) estiverem no escopo do usuário — paróquias para `SECRETARIA_PAROQUIA` e setores para `SECRETARIA_CNC`. `ADMIN` SHALL manter a criação irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: SECRETARIA_PAROQUIA cria casal com as duas pessoas no escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `POST /pessoa/casal` com `pessoaId` e `conjugueId` de pessoas com vínculo ativo em comunidades da paróquia X
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_PAROQUIA cria casal com uma pessoa sem vínculo ativo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` envia `POST /pessoa/casal` com uma das pessoas sem vínculo ativo com comunidade
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_PAROQUIA cria casal com uma pessoa fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `POST /pessoa/casal` com uma pessoa de vínculo ativo na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: SECRETARIA_PAROQUIA cria casal com as duas pessoas fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X envia `POST /pessoa/casal` com as duas pessoas de vínculo ativo na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas no escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /pessoa/casal` com `pessoaId` e `conjugueId` de pessoas com vínculo ativo em comunidades de paróquias do setor S
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa sem vínculo ativo
- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /pessoa/casal` com uma das pessoas sem vínculo ativo com comunidade
- **THEN** o sistema responde 201 e o casal é criado

#### Scenario: SECRETARIA_CNC cria casal com uma pessoa fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /pessoa/casal` com uma pessoa de vínculo ativo em paróquia de outro setor
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o casal

#### Scenario: SECRETARIA_CNC cria casal com as duas pessoas fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /pessoa/casal` com as duas pessoas de vínculo ativo em paróquia de outro setor
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

### Requirement: Leitura de cônjuges no escopo de paróquia e setor

O sistema SHALL permitir que `SECRETARIA_PAROQUIA` liste cônjuges disponíveis por `GET /pessoa/conjugue` apenas para pessoas nas suas paróquias e que `SECRETARIA_CNC` liste apenas para pessoas nas paróquias dos seus setores. `ADMIN` SHALL listar todos os cônjuges disponíveis. `NAO_IDENTIFICADO` SHALL ser rejeitado com 403.

#### Scenario: SECRETARIA_PAROQUIA lista cônjuges da própria paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado à paróquia X chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém apenas pessoas casadas sem cônjuge cujo vínculo ativo está na paróquia X

#### Scenario: SECRETARIA_PAROQUIA sem paróquias lista cônjuges
- **WHEN** um usuário `SECRETARIA_PAROQUIA` sem vínculos em `usuarioParoquia` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta é 200 com lista vazia

#### Scenario: SECRETARIA_CNC lista cônjuges dos seus setores
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém apenas pessoas cujo vínculo ativo está em paróquias do setor S

#### Scenario: SECRETARIA_CNC sem setores lista cônjuges
- **WHEN** um usuário `SECRETARIA_CNC` sem vínculos em `usuarioSetor` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta é 200 com lista vazia

#### Scenario: ADMIN lista todos os cônjuges
- **WHEN** um usuário `ADMIN` chama `GET /pessoa/conjugue?sexo=M`
- **THEN** a resposta contém cônjuges disponíveis de todas as paróquias, sem restrição

#### Scenario: Perfil sem permissão de leitura de cônjuges
- **WHEN** um usuário sem permissão de leitura de pessoa chama `GET /pessoa/conjugue?sexo=M`
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403
