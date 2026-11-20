# Spec Delta

## MODIFIED Requirements

### Requirement: Escopo de listagem de comunidades por paróquia

Ao listar comunidades, um usuário `SECRETARIA_PAROQUIA` SHALL receber apenas as comunidades das paróquias vinculadas a ele em `usuarioParoquia`, e um usuário `SECRETARIA_CNC` SHALL receber apenas as comunidades das paróquias cujos setores pertencem às regiões vinculadas a ele em `usuarioRegiao`.

#### Scenario: Usuário com paróquias vinculadas
- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado a uma ou mais paróquias lista comunidades sem filtros
- **THEN** a resposta contém apenas comunidades cuja paróquia está entre as paróquias do usuário

#### Scenario: Usuário sem paróquias vinculadas
- **WHEN** um usuário `SECRETARIA_PAROQUIA` sem paróquias vinculadas lista comunidades
- **THEN** a resposta é 200 com lista vazia

#### Scenario: SECRETARIA_CNC com regiões vinculadas
- **WHEN** um usuário `SECRETARIA_CNC` vinculado a uma ou mais regiões lista comunidades sem filtros
- **THEN** a resposta contém apenas comunidades de paróquias cujos setores pertencem às regiões do usuário

#### Scenario: SECRETARIA_CNC sem regiões vinculadas
- **WHEN** um usuário `SECRETARIA_CNC` sem regiões vinculadas lista comunidades
- **THEN** a resposta é 200 com lista vazia

### Requirement: Interseção do escopo com os filtros de listagem

Os filtros opcionais da listagem de comunidades SHALL ser aplicados em conjunto com o escopo de paróquia do usuário, de modo que o resultado nunca inclua comunidades fora das paróquias sob sua responsabilidade, sejam elas vinculadas diretamente ao `SECRETARIA_PAROQUIA` ou alcançadas pelas regiões do `SECRETARIA_CNC`.

#### Scenario: Filtro de paróquia dentro do escopo
- **WHEN** um usuário de secretaria filtra a listagem por uma paróquia que está sob sua responsabilidade
- **THEN** a resposta contém apenas as comunidades dessa paróquia

#### Scenario: Filtro de paróquia fora do escopo
- **WHEN** um usuário de secretaria filtra a listagem por uma paróquia que não está sob sua responsabilidade
- **THEN** a resposta é 200 com lista vazia

#### Scenario: Filtro por número da comunidade
- **WHEN** um usuário de secretaria filtra a listagem por número da comunidade
- **THEN** a resposta contém apenas comunidades que atendem ao número e pertencem ao escopo do usuário

### Requirement: Preservação do acesso dos demais perfis

A restrição por paróquia SHALL aplicar-se apenas aos perfis `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC`; os demais perfis SHALL manter o comportamento atual de listagem, cadastro e atualização de comunidades, incluindo o acesso irrestrito de `ADMIN`.

#### Scenario: ADMIN lista todas as comunidades
- **WHEN** um usuário `ADMIN` lista comunidades
- **THEN** a resposta contém comunidades de todas as paróquias, como antes

#### Scenario: ADMIN cadastra em qualquer paróquia
- **WHEN** um usuário `ADMIN` cadastra uma comunidade em uma paróquia arbitrária
- **THEN** o sistema responde 201, sem restrição de escopo de paróquia

#### Scenario: ADMIN atualiza comunidade de qualquer paróquia
- **WHEN** um usuário `ADMIN` atualiza uma comunidade de uma paróquia arbitrária
- **THEN** o sistema responde 200, sem restrição de escopo de paróquia

#### Scenario: Perfil sem permissão de leitura
- **WHEN** um usuário sem permissão de leitura de comunidade tenta listar comunidades
- **THEN** o sistema continua respondendo 403, conforme a regra de proteção vigente

#### Scenario: Perfil sem permissão de escrita
- **WHEN** um usuário sem permissão de cadastro ou atualização de comunidade tenta cadastrar ou atualizar uma comunidade
- **THEN** o sistema responde 403, conforme a regra de proteção vigente

### Requirement: Cadastro de comunidade restrito às paróquias do usuário

Um usuário com permissão de cadastro de comunidade SHALL cadastrar comunidade apenas em paróquias do seu escopo: as vinculadas em `usuarioParoquia` para o `SECRETARIA_PAROQUIA` e as dos setores das regiões vinculadas em `usuarioRegiao` para o `SECRETARIA_CNC`. Solicitação para paróquia fora do escopo SHALL ser rejeitada com 403, e para paróquia inexistente o sistema SHALL responder 404.

#### Scenario: Cadastro em paróquia própria
- **WHEN** um usuário de secretaria cadastra uma comunidade com `paroquiaId` de uma paróquia do seu escopo
- **THEN** o sistema responde 201 e a comunidade é criada nessa paróquia

#### Scenario: Cadastro em paróquia fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` cadastra uma comunidade com `paroquiaId` de uma paróquia não vinculada a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar a comunidade

#### Scenario: Cadastro com paróquia inexistente
- **WHEN** um usuário com permissão de cadastro cadastra uma comunidade com `paroquiaId` de uma paróquia inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Paroquia' não foi encontrado.` e `statusCode` 404

#### Scenario: SECRETARIA_CNC cadastra em paróquia de outra região
- **WHEN** um usuário `SECRETARIA_CNC` cadastra uma comunidade em uma paróquia cujo setor não pertence às suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar a comunidade

### Requirement: Atualização de comunidade restrita às paróquias do usuário

Um usuário com permissão de atualização de comunidade SHALL atualizar apenas comunidades cuja paróquia esteja no seu escopo, definido por `usuarioParoquia` para o `SECRETARIA_PAROQUIA` e pelas regiões de `usuarioRegiao` para o `SECRETARIA_CNC`; comunidade fora do escopo SHALL ser rejeitada com 403, e comunidade inexistente o sistema SHALL responder 404.

#### Scenario: Atualização de comunidade da própria paróquia
- **WHEN** um usuário de secretaria atualiza uma comunidade cuja paróquia está no seu escopo
- **THEN** o sistema responde 200 e a comunidade é atualizada

#### Scenario: Atualização de comunidade fora do escopo
- **WHEN** um usuário `SECRETARIA_PAROQUIA` atualiza uma comunidade cuja paróquia não está vinculada a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar a comunidade

#### Scenario: Atualização de comunidade inexistente
- **WHEN** um usuário com permissão de atualização atualiza uma comunidade inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Comunidade' não foi encontrado.` e `statusCode` 404

#### Scenario: Vínculo de pessoa em comunidade da própria paróquia
- **WHEN** um usuário de secretaria adiciona ou remove uma pessoa vinculada em uma comunidade cuja paróquia está no seu escopo
- **THEN** a operação é processada com sucesso

#### Scenario: Vínculo de pessoa em comunidade fora do escopo
- **WHEN** um usuário de secretaria adiciona ou remove uma pessoa em uma comunidade cuja paróquia está fora do seu escopo
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar os vínculos da comunidade

#### Scenario: SECRETARIA_CNC atualiza comunidade de outra região
- **WHEN** um usuário `SECRETARIA_CNC` atualiza uma comunidade cuja paróquia pertence a um setor fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar a comunidade

### Requirement: Adição de pessoa em comunidade restrita ao escopo da pessoa

Ao adicionar uma pessoa a uma comunidade, o sistema SHALL validar, **antes** de criar o vínculo, que a pessoa já está dentro do escopo de atualização do usuário (vínculo ativo em uma comunidade de uma paróquia do escopo, ou sem vínculo ativo). O vínculo criado por essa operação SHALL NOT conceder, por si só, autorização de edição sobre a pessoa. Pessoa fora do escopo SHALL ser rejeitada com 403, e pessoa inexistente SHALL responder 404.

#### Scenario: Adicionar pessoa já no escopo
- **WHEN** um usuário de secretaria adiciona uma pessoa sem vínculo ativo ou com vínculo ativo em uma comunidade do seu escopo a uma comunidade do seu escopo
- **THEN** o vínculo é criado com sucesso

#### Scenario: Adicionar pessoa de outra paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` adiciona uma pessoa cujo vínculo ativo está em uma comunidade de outra paróquia a uma comunidade da sua paróquia
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o vínculo

#### Scenario: Adicionar pessoa inexistente
- **WHEN** um usuário com permissão de atualização de comunidade adiciona uma pessoa inexistente a uma comunidade
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404

#### Scenario: SECRETARIA_CNC adiciona pessoa de outra região
- **WHEN** um usuário `SECRETARIA_CNC` adiciona uma pessoa cujo vínculo ativo está em uma comunidade de uma paróquia fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar o vínculo
