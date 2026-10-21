# Escopo Acesso Paroquia Specification

## Purpose

Define como o acesso a recursos pertencentes a uma paróquia é restringido conforme o perfil (role) do usuário e as paróquias sob sua responsabilidade, começando pela listagem de comunidades.

## Requirements

### Requirement: Escopo de listagem de comunidades por paróquia

Ao listar comunidades, um usuário com o perfil `SECRETARIA_CNC` SHALL receber apenas as comunidades das paróquias sob sua responsabilidade (aquelas vinculadas a ele), e não as comunidades das demais paróquias.

#### Scenario: Usuário com paróquias vinculadas
- **WHEN** um usuário `SECRETARIA_CNC` vinculado a uma ou mais paróquias lista comunidades sem filtros
- **THEN** a resposta contém apenas comunidades cuja paróquia está entre as paróquias do usuário

#### Scenario: Usuário sem paróquias vinculadas
- **WHEN** um usuário `SECRETARIA_CNC` sem paróquias vinculadas lista comunidades
- **THEN** a resposta é 200 com lista vazia

### Requirement: Interseção do escopo com os filtros de listagem

Os filtros opcionais da listagem de comunidades SHALL ser aplicados em conjunto com o escopo de paróquia do usuário, de modo que o resultado nunca inclua comunidades fora das paróquias sob sua responsabilidade.

#### Scenario: Filtro de paróquia dentro do escopo
- **WHEN** um usuário `SECRETARIA_CNC` filtra a listagem por uma paróquia que está sob sua responsabilidade
- **THEN** a resposta contém apenas as comunidades dessa paróquia

#### Scenario: Filtro de paróquia fora do escopo
- **WHEN** um usuário `SECRETARIA_CNC` filtra a listagem por uma paróquia que não está sob sua responsabilidade
- **THEN** a resposta é 200 com lista vazia

#### Scenario: Filtro por número da comunidade
- **WHEN** um usuário `SECRETARIA_CNC` filtra a listagem por número da comunidade
- **THEN** a resposta contém apenas comunidades que atendem ao número e pertencem às paróquias do usuário

### Requirement: Preservação do acesso dos demais perfis

A restrição por paróquia SHALL aplicar-se apenas ao perfil `SECRETARIA_CNC`; os demais perfis SHALL manter o comportamento atual de listagem, incluindo o acesso irrestrito de `ADMIN`.

#### Scenario: ADMIN lista todas as comunidades
- **WHEN** um usuário `ADMIN` lista comunidades
- **THEN** a resposta contém comunidades de todas as paróquias, como antes

#### Scenario: Perfil sem permissão de leitura
- **WHEN** um usuário sem permissão de leitura de comunidade tenta listar comunidades
- **THEN** o sistema continua respondendo 403, conforme a regra de proteção vigente