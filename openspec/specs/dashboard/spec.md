# Dashboard Specification

## Purpose

Define o contrato de leitura dos indicadores agregados exibidos no dashboard, com números globais calculados sob demanda, política de atualização por cache de curto prazo e controle de acesso coerente com as permissões de leitura de pessoa.

## Requirements

### Requirement: Indicadores agregados do dashboard

O sistema SHALL expor `GET /dashboard` retornando, em uma única resposta, os indicadores `pessoas`, `paroquias`, `dioceses`, `comunidades`, `equipes`, `carismas` e `usuarios`. Cada indicador SHALL ser um número inteiro não negativo ou um objeto com os campos definidos nos requisitos seguintes.

#### Scenario: Leitura bem-sucedida do dashboard

- **WHEN** um usuário identificado autenticado chama `GET /dashboard`
- **THEN** o sistema responde 200 com `data` contendo exatamente os grupos `pessoas`, `paroquias`, `dioceses`, `comunidades`, `equipes`, `carismas` e `usuarios`

#### Scenario: Base vazia

- **WHEN** não existe nenhum registro de negócio no banco
- **THEN** o sistema responde 200 com todos os indicadores iguais a zero, sem campos nulos e sem erro

### Requirement: Contagem de pessoas por situação

O indicador `pessoas` SHALL conter `total`, `ativas` e `inativas`, em que `total` é a quantidade de registros de pessoa, `ativas` conta `ativo = true` e `inativas` conta `ativo = false`. A soma de `ativas` e `inativas` SHALL ser igual a `total` na mesma resposta.

#### Scenario: Contagem com pessoas ativas e inativas

- **WHEN** a base contém 10 pessoas, sendo 7 ativas e 3 inativas
- **THEN** a resposta contém `pessoas.total` 10, `pessoas.ativas` 7 e `pessoas.inativas` 3

#### Scenario: Contagem sem pessoas cadastradas

- **WHEN** não existe nenhuma pessoa cadastrada
- **THEN** a resposta contém `pessoas.total`, `pessoas.ativas` e `pessoas.inativas` iguais a 0

### Requirement: Contagem de carismas e vínculos

O indicador `carismas` SHALL conter `total`, com a quantidade de carismas cadastrados, e `vinculos`, com a quantidade de registros de vínculo entre pessoa e carisma. O valor de `vinculos` SHALL contar vínculos, não pessoas distintas.

#### Scenario: Contagem de carismas e vínculos

- **WHEN** existem 4 carismas cadastrados e uma mesma pessoa possui 3 vínculos de carisma
- **THEN** a resposta contém `carismas.total` 4 e `carismas.vinculos` 3

#### Scenario: Uma pessoa com múltiplos carismas

- **WHEN** duas pessoas somam 5 vínculos de carisma
- **THEN** a resposta contém `carismas.vinculos` 5, ainda que o número de pessoas vinculadas seja menor

### Requirement: Contagem de usuários por papel

O indicador `usuarios` SHALL conter `total`, com a quantidade de usuários cadastrados, e `porPapel`, com a quantidade de usuários em cada papel do domínio. `porPapel` SHALL incluir todos os papéis do domínio, inclusive os que não têm nenhum usuário, com valor 0.

#### Scenario: Distribuição de usuários por papel

- **WHEN** existem 3 usuários `ADMIN` e 2 usuários `SECRETARIA_PAROQUIA`
- **THEN** a resposta contém `usuarios.total` 5, `usuarios.porPapel.ADMIN` 3, `usuarios.porPapel.SECRETARIA_PAROQUIA` 2 e os demais papéis com valor 0

#### Scenario: Papel sem usuários

- **WHEN** nenhum usuário possui o papel `CATEQUISTA_NACIONAL`
- **THEN** a resposta contém `usuarios.porPapel.CATEQUISTA_NACIONAL` igual a 0

### Requirement: Contagem das entidades territoriais e de organização

O sistema SHALL contar, respectivamente, todos os registros de paróquia, diocese, comunidade e equipe, sem filtro por situação, região ou paróquia.

#### Scenario: Contagem das entidades

- **WHEN** a base contém 12 paróquias, 2 dioceses, 30 comunidades e 8 equipes
- **THEN** a resposta contém `paroquias` 12, `dioceses` 2, `comunidades` 30 e `equipes` 8

### Requirement: Números globais independentes do perfil

Os indicadores SHALL ser globais e SHALL NOT ser recortados pelo escopo de paróquias ou regiões do usuário. Usuários diferentes com acesso ao dashboard SHALL receber os mesmos totais para a mesma base.

#### Scenario: Secretaria vê os mesmos totais do administrador

- **WHEN** um usuário `SECRETARIA_PAROQUIA` vinculado a uma única paróquia e um usuário `ADMIN` chamam `GET /dashboard` sobre a mesma base
- **THEN** ambos recebem os mesmos valores para todos os indicadores

#### Scenario: Secretaria sem vínculo vê os totais nacionais

- **WHEN** um usuário de secretaria sem paróquias ou regiões vinculadas chama `GET /dashboard`
- **THEN** a resposta contém os totais de toda a base, e não zeros por falta de vínculo

### Requirement: Atualização dos indicadores por cache de curto prazo

O sistema SHALL calcular os indicadores sob demanda, a partir dos dados correntes, e SHALL NOT persistir contadores agregados em tabela própria. A resposta PODE ser servida de um cache em memória, e o sistema SHALL refletir qualquer alteração da base em, no máximo, 60 segundos após a alteração.

#### Scenario: Alteração refletida após o cache expirar

- **WHEN** uma pessoa é criada e o dashboard é consultado novamente após 60 segundos da resposta anterior
- **THEN** o indicador `pessoas.total` já reflete a nova pessoa

#### Scenario: Consultas repetidas dentro da janela de cache

- **WHEN** o dashboard é consultado duas vezes dentro de 60 segundos sem alteração na base
- **THEN** as duas respostas são 200 e apresentam os mesmos indicadores

### Requirement: Coerência dos indicadores em uma resposta

Todos os indicadores de uma mesma resposta SHALL ser provenientes de um único ciclo de cálculo. Uma resposta servida de cache SHALL NOT combinar indicadores calculados em momentos diferentes.

#### Scenario: Resposta não mistura ciclos de cálculo

- **WHEN** a base muda enquanto uma resposta está sendo montada
- **THEN** todos os indicadores da resposta pertencem ao mesmo ciclo, sem misturar valores antigos e novos do mesmo grupo

### Requirement: Autorização do dashboard

O sistema SHALL exigir autenticação em `GET /dashboard` e SHALL permitir o acesso apenas a perfis com permissão de leitura de pessoa. Requisição sem token SHALL receber 401 e perfil sem essa permissão SHALL receber 403, sem retornar indicadores.

#### Scenario: Acesso sem autenticação

- **WHEN** um cliente chama `GET /dashboard` sem token
- **THEN** o sistema responde 401 com `error` `Unauthorized` e `statusCode` 401

#### Scenario: Acesso com perfil não identificado

- **WHEN** um usuário autenticado com papel `NAO_IDENTIFICADO` chama `GET /dashboard`
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem expor indicadores

#### Scenario: Acesso com perfil autorizado

- **WHEN** um usuário `ADMIN`, catequista ou de secretaria chama `GET /dashboard`
- **THEN** o sistema responde 200 com os indicadores

### Requirement: Envelope padrão e ausência de dados pessoais

A resposta de `GET /dashboard` SHALL seguir o envelope padrão da API, com `server`, `total`, `page`, `limit` e `data`. O indicador SHALL conter apenas contagens e SHALL NOT expor nomes, documentos, contatos, identificadores de pessoas ou campos de auditoria.

#### Scenario: Resposta no envelope padrão

- **WHEN** um usuário autorizado chama `GET /dashboard`
- **THEN** o corpo contém `server`, `total` 1, `page` 1, `limit` 1 e `data` com os indicadores

#### Scenario: Nenhum dado pessoal na resposta

- **WHEN** a resposta do dashboard é inspecionada
- **THEN** ela não contém nome, CPF, e-mail, WhatsApp, id de pessoa, `cadastradoPorId` nem `atualizadoPorId`
