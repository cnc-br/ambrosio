# Spec Delta

## Purpose

Define o domínio territorial do sistema como um conjunto único (mapa) e o contrato de criação e atualização de macro-regiões, regiões e setores, com hierarquia validada, autorização por papel e auditoria de autoria.

## ADDED Requirements

### Requirement: Preservação das rotas de leitura do mapa

O sistema SHALL preservar as rotas de leitura existentes (`GET /macro-regiao`, `GET /macro-regiao/:id`, `GET /regiao`, `GET /regiao/:id`, `GET /setor` e `GET /setor/:id`) públicas e com o mesmo contrato de resposta. O sistema SHALL NOT expor recurso HTTP em `/mapa`.

#### Scenario: Leitura pública preservada

- **WHEN** um cliente chama qualquer rota de leitura de macro-região, região ou setor sem token de autenticação
- **THEN** o sistema responde 200 com o envelope padrão de listagem ou com o registro solicitado

#### Scenario: Recurso mapa inexistente

- **WHEN** um cliente chama `POST /mapa`
- **THEN** o sistema responde 404, pois não existe recurso HTTP em `/mapa`

### Requirement: Criação de macro-região

O sistema SHALL criar uma macro-região por meio de `POST /macro-regiao`, aceitando `descricao` (texto obrigatório de até 50 caracteres) e `ativo` (booleano opcional, padrão `true`). Em caso de sucesso, SHALL responder 201 com a macro-região criada.

#### Scenario: Macro-região criada com sucesso

- **WHEN** um usuário autorizado envia `POST /macro-regiao` com `{ "descricao": "Sudeste" }`
- **THEN** o sistema responde 201 com `id`, `descricao` e `ativo` iguais a `true`

#### Scenario: Payload inválido na criação de macro-região

- **WHEN** um usuário autorizado envia `POST /macro-regiao` sem `descricao` ou com mais de 50 caracteres
- **THEN** o sistema responde 400 sem criar a macro-região

### Requirement: Atualização de macro-região

O sistema SHALL atualizar uma macro-região existente por meio de `PATCH /macro-regiao/:id`, aceitando `descricao` e/ou `ativo` de forma parcial. Em caso de sucesso, SHALL responder 200 com a macro-região atualizada.

#### Scenario: Macro-região atualizada com sucesso

- **WHEN** um usuário autorizado envia `PATCH /macro-regiao/1` com `{ "descricao": "Sudeste Brasileiro", "ativo": false }`
- **THEN** o sistema responde 200 com `descricao` e `ativo` atualizados

#### Scenario: Macro-região inexistente na atualização

- **WHEN** um usuário autorizado envia `PATCH /macro-regiao/999` para um id que não existe
- **THEN** o sistema responde 404 sem criar nenhum registro

### Requirement: Criação de região

O sistema SHALL criar uma região por meio de `POST /regiao`, aceitando `descricao` (texto obrigatório de até 100 caracteres), `macroRegiao` (objeto com `id` obrigatório) e `ativo` (booleano opcional, padrão `true`). Em caso de sucesso, SHALL responder 201 com a região criada e sua macro-região.

#### Scenario: Região criada com sucesso

- **WHEN** um usuário autorizado envia `POST /regiao` com `{ "descricao": "Interior", "macroRegiao": { "id": 1 } }`
- **THEN** o sistema responde 201 com a região criada vinculada à macro-região informada

#### Scenario: Macro-região inexistente na criação de região

- **WHEN** um usuário autorizado envia `POST /regiao` com `macroRegiao.id` de uma macro-região inexistente
- **THEN** o sistema responde 404 sem criar a região

#### Scenario: Região duplicada na mesma macro-região

- **WHEN** um usuário autorizado tenta criar uma região com `descricao` já usada na mesma macro-região
- **THEN** o sistema responde 400 sem criar a região

### Requirement: Atualização de região

O sistema SHALL atualizar uma região existente por meio de `PATCH /regiao/:id`, aceitando `descricao`, `ativo` e/ou `macroRegiao` de forma parcial. Quando `macroRegiao` não for informada, SHALL manter a macro-região atual. Em caso de sucesso, SHALL responder 200 com a região atualizada.

#### Scenario: Região movida de macro-região

- **WHEN** um usuário autorizado envia `PATCH /regiao/2` com `{ "macroRegiao": { "id": 3 } }`
- **THEN** o sistema responde 200 com a região vinculada à macro-região 3

#### Scenario: Atualização sem macro-região mantém o vínculo

- **WHEN** um usuário autorizado envia `PATCH /regiao/2` apenas com `{ "descricao": "Interior Paulista" }`
- **THEN** o sistema responde 200 mantendo o `macroRegiaoId` anterior

#### Scenario: Região ou macro-região inexistente na atualização

- **WHEN** um usuário autorizado envia `PATCH /regiao/999` ou informa uma `macroRegiao.id` inexistente
- **THEN** o sistema responde 404 sem alterar registros

### Requirement: Criação de setor

O sistema SHALL criar um setor por meio de `POST /setor`, aceitando `descricao` (texto obrigatório de até 50 caracteres), `regiao` (objeto com `id` obrigatório) e `ativo` (booleano opcional, padrão `true`). Em caso de sucesso, SHALL responder 201 com o setor criado e sua região.

#### Scenario: Setor criado com sucesso

- **WHEN** um usuário autorizado envia `POST /setor` com `{ "descricao": "Setor 10", "regiao": { "id": 1 } }`
- **THEN** o sistema responde 201 com o setor criado vinculado à região informada

#### Scenario: Região inexistente na criação de setor

- **WHEN** um usuário autorizado envia `POST /setor` com `regiao.id` de uma região inexistente
- **THEN** o sistema responde 404 sem criar o setor

#### Scenario: Setor duplicado na mesma região

- **WHEN** um usuário autorizado tenta criar um setor com `descricao` já usada na mesma região
- **THEN** o sistema responde 400 sem criar o setor

### Requirement: Atualização de setor

O sistema SHALL atualizar um setor existente por meio de `PATCH /setor/:id`, aceitando `descricao`, `ativo` e/ou `regiao` de forma parcial. Quando `regiao` não for informada, SHALL manter a região atual. Em caso de sucesso, SHALL responder 200 com o setor atualizado.

#### Scenario: Setor movido de região

- **WHEN** um usuário autorizado envia `PATCH /setor/3` com `{ "regiao": { "id": 2 } }`
- **THEN** o sistema responde 200 com o setor vinculado à região 2

#### Scenario: Atualização sem região mantém o vínculo

- **WHEN** um usuário autorizado envia `PATCH /setor/3` apenas com `{ "ativo": false }`
- **THEN** o sistema responde 200 mantendo o `regiaoId` anterior e com `ativo` igual a `false`

#### Scenario: Setor ou região inexistente na atualização

- **WHEN** um usuário autorizado envia `PATCH /setor/999` ou informa uma `regiao.id` inexistente
- **THEN** o sistema responde 404 sem alterar registros

### Requirement: Autorização das rotas de escrita

O sistema SHALL exigir autenticação nas rotas de escrita `POST/PATCH` de macro-região, região e setor e SHALL permiti-las apenas aos papéis `ADMIN` e `SECRETARIA_CNC`. As rotas de leitura SHALL continuar públicas.

#### Scenario: Escrita sem autenticação

- **WHEN** um cliente envia `POST` ou `PATCH` em `/macro-regiao`, `/regiao` ou `/setor` sem token
- **THEN** o sistema responde 401 sem executar a escrita

#### Scenario: Escrita com papel não autorizado

- **WHEN** um usuário autenticado com papel `SECRETARIA_PAROQUIA` envia uma rota de escrita do mapa
- **THEN** o sistema responde 403 sem executar a escrita

#### Scenario: Escrita autorizada

- **WHEN** um usuário `ADMIN` ou `SECRETARIA_CNC` envia uma rota de escrita do mapa
- **THEN** o sistema executa a criação ou atualização e responde 201 ou 200

### Requirement: Auditoria das escritas do mapa

O sistema SHALL registrar a autoria das escritas do mapa a partir do usuário autenticado: na criação, `cadastradoPorId` e `atualizadoPorId`; na atualização, `atualizadoPorId`. Os campos de auditoria não SHALL ser aceitos no payload nem expostos na resposta.

#### Scenario: Autoria registrada na criação

- **WHEN** um usuário autenticado cria uma macro-região, região ou setor
- **THEN** o registro persistido contém `cadastradoPorId` e `atualizadoPorId` iguais ao id do usuário autenticado

#### Scenario: Autoria registrada na atualização

- **WHEN** um usuário autenticado atualiza uma macro-região, região ou setor
- **THEN** o registro persistido contém `atualizadoPorId` igual ao id do usuário autenticado

#### Scenario: Auditoria não exposta

- **WHEN** o sistema responde uma criação ou atualização do mapa
- **THEN** o corpo da resposta não contém `cadastradoPorId` nem `atualizadoPorId`
