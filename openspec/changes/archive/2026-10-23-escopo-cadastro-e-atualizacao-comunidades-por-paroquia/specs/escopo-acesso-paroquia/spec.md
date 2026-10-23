# Spec Delta

## ADDED Requirements

### Requirement: Cadastro de comunidade restrito às paróquias do usuário

Um usuário com permissão de cadastro de comunidade (perfil `SECRETARIA_CNC`) SHALL cadastrar comunidade apenas em paróquias vinculadas a ele em `usuarioParoquia`; solicitação para paróquia fora do escopo SHALL ser rejeitada com 403, e para paróquia inexistente o sistema SHALL responder 404.

#### Scenario: Cadastro em paróquia própria
- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X cadastra uma comunidade com `paroquiaId` igual a X
- **THEN** o sistema responde 201 e a comunidade é criada na paróquia X

#### Scenario: Cadastro em paróquia fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` cadastra uma comunidade com `paroquiaId` de uma paróquia não vinculada a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar a comunidade

#### Scenario: Cadastro com paróquia inexistente
- **WHEN** um usuário com permissão de cadastro cadastra uma comunidade com `paroquiaId` de uma paróquia inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Paroquia' não foi encontrado.` e `statusCode` 404

### Requirement: Atualização de comunidade restrita às paróquias do usuário

Um usuário com permissão de atualização de comunidade (perfil `SECRETARIA_CNC`) SHALL atualizar apenas comunidades cuja paróquia esteja vinculada a ele em `usuarioParoquia`; comunidade fora do escopo SHALL ser rejeitada com 403, e comunidade inexistente o sistema SHALL responder 404.

#### Scenario: Atualização de comunidade da própria paróquia
- **WHEN** um usuário `SECRETARIA_CNC` atualiza uma comunidade cuja paróquia está vinculada a ele
- **THEN** o sistema responde 200 e a comunidade é atualizada

#### Scenario: Atualização de comunidade fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` atualiza uma comunidade cuja paróquia não está vinculada a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar a comunidade

#### Scenario: Atualização de comunidade inexistente
- **WHEN** um usuário com permissão de atualização atualiza uma comunidade inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Comunidade' não foi encontrado.` e `statusCode` 404

#### Scenario: Vínculo de pessoa em comunidade da própria paróquia
- **WHEN** um usuário `SECRETARIA_CNC` adiciona ou remove uma pessoa vinculada em uma comunidade cuja paróquia está vinculada a ele
- **THEN** a operação é processada com sucesso

#### Scenario: Vínculo de pessoa em comunidade fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` adiciona ou remove uma pessoa em uma comunidade cuja paróquia não está vinculada a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar os vínculos da comunidade

## MODIFIED Requirements

### Requirement: Preservação do acesso dos demais perfis

A restrição por paróquia SHALL aplicar-se apenas ao perfil `SECRETARIA_CNC`; os demais perfis SHALL manter o comportamento atual de listagem, cadastro e atualização de comunidades, incluindo o acesso irrestrito de `ADMIN`.

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