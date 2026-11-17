# Spec Delta

## Purpose

Define o modelo de papéis e permissões do sistema, a base de capacidades compartilhada pelas secretarias e as estratégias de escopo (paróquia e setor) usadas para autorizar o acesso aos recursos.

## ADDED Requirements

### Requirement: Base compartilhada de capacidades das secretarias

O sistema SHALL manter uma base única de capacidades compartilhada pelos perfis `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC`, de modo que ambos executem as mesmas operações de secretaria. O `SECRETARIA_CNC` SHALL possuir, adicionalmente, as capacidades de criar, atualizar e excluir paróquias e as capacidades de criar, atualizar e excluir dioceses.

#### Scenario: Operação da base disponível para os dois perfis
- **WHEN** uma operação faz parte da base compartilhada de secretaria (por exemplo, cadastrar pessoa, atualizar comunidade ou ler carisma)
- **THEN** os perfis `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC` são autorizados conforme o escopo de cada um

#### Scenario: Operação exclusiva do SECRETARIA_CNC
- **WHEN** a operação é criar, atualizar ou excluir uma paróquia, ou criar, atualizar ou excluir uma diocese
- **THEN** somente `ADMIN` e `SECRETARIA_CNC` são autorizados; `SECRETARIA_PAROQUIA` é rejeitado com 403

### Requirement: Gestão de diocese pelo SECRETARIA_CNC

O sistema SHALL conceder ao perfil `SECRETARIA_CNC` as capacidades de criar, ler, atualizar e excluir dioceses, sem restrição de paróquia ou setor. O `ADMIN` SHALL manter a gestão irrestrita e o `SECRETARIA_PAROQUIA` SHALL NOT receber as capacidades de gestão de diocese.

#### Scenario: SECRETARIA_CNC cadastra diocese
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `POST /diocese` com payload válido
- **THEN** o sistema responde 201 e a diocese é criada

#### Scenario: SECRETARIA_CNC lê dioceses
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `GET /diocese` ou `GET /diocese/:id`
- **THEN** o sistema responde 200 com as dioceses, sem restrição de escopo

#### Scenario: SECRETARIA_CNC atualiza diocese
- **WHEN** um usuário `SECRETARIA_CNC` autenticado envia `PATCH /diocese/:id` com payload válido
- **THEN** o sistema responde 200 e a diocese é atualizada

#### Scenario: Capacidade de exclusão de diocese do SECRETARIA_CNC
- **WHEN** o modelo de permissões de um usuário `SECRETARIA_CNC` é avaliado para a ação de excluir diocese
- **THEN** a ação é autorizada, sem restrição de escopo

#### Scenario: SECRETARIA_PAROQUIA não gerencia diocese
- **WHEN** um usuário `SECRETARIA_PAROQUIA` autenticado tenta criar, atualizar ou excluir diocese
- **THEN** o modelo de permissões nega a ação de gestão e o sistema rejeita com 403 quando a capacidade é exigida pelo endpoint

#### Scenario: ADMIN gerencia diocese sem restrição
- **WHEN** um usuário `ADMIN` autenticado cria, lê, atualiza ou exclui uma diocese
- **THEN** a operação é autorizada, sem restrição de escopo

### Requirement: Escopo por paróquia do SECRETARIA_PAROQUIA

O sistema SHALL restringir as operações do `SECRETARIA_PAROQUIA` sobre recursos vinculados a paróquia às paróquias registradas para o usuário em `usuarioParoquia`.

#### Scenario: Recurso dentro das paróquias do usuário
- **WHEN** um usuário `SECRETARIA_PAROQUIA` acessa um recurso de uma paróquia vinculada a ele
- **THEN** a operação é autorizada

#### Scenario: Recurso fora das paróquias do usuário
- **WHEN** um usuário `SECRETARIA_PAROQUIA` acessa um recurso de uma paróquia não vinculada a ele
- **THEN** a operação é rejeitada com 403, ou a listagem retorna vazio quando a operação for de leitura coletiva

#### Scenario: Usuário sem paróquias
- **WHEN** um usuário `SECRETARIA_PAROQUIA` sem vínculos em `usuarioParoquia` executa uma listagem restrita por paróquia
- **THEN** a resposta é 200 com lista vazia

### Requirement: Escopo por setor do SECRETARIA_CNC

O sistema SHALL restringir as operações do `SECRETARIA_CNC` sobre recursos vinculados a paróquia às paróquias cujo `setor` esteja registrado para o usuário em `usuarioSetor`.

#### Scenario: Recurso de paróquia de um setor do usuário
- **WHEN** um usuário `SECRETARIA_CNC` acessa um recurso de uma paróquia cujo setor está vinculado a ele
- **THEN** a operação é autorizada

#### Scenario: Recurso de paróquia de setor não vinculado
- **WHEN** um usuário `SECRETARIA_CNC` acessa um recurso de uma paróquia cujo setor não está vinculado a ele
- **THEN** a operação é rejeitada com 403, ou a listagem retorna vazio quando a operação for de leitura coletiva

#### Scenario: Usuário sem setores
- **WHEN** um usuário `SECRETARIA_CNC` sem vínculos em `usuarioSetor` executa uma listagem restrita por setor
- **THEN** a resposta é 200 com lista vazia

### Requirement: Inclusão de novas permissões em ponto único

Uma nova capacidade de secretaria SHALL ser incluída uma única vez na base compartilhada e passar a valer para `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC`, respeitando o escopo de cada perfil, sem exigir regra duplicada por papel.

#### Scenario: Nova capacidade vale para os dois perfis
- **WHEN** uma nova capacidade é adicionada à base compartilhada de secretaria
- **THEN** os dois perfis passam a executá-la nos seus respectivos escopos, sem necessidade de alterar a definição de cada papel separadamente

#### Scenario: Capacidade fora da base permanece restrita
- **WHEN** uma capacidade é adicionada apenas a um papel específico, como a gestão de paróquias do `SECRETARIA_CNC`
- **THEN** o outro papel continua sem essa capacidade

### Requirement: ADMIN permanece irrestrito

O sistema SHALL manter o perfil `ADMIN` com acesso irrestrito a todos os recursos, independentemente das estratégias de escopo aplicadas às secretarias.

#### Scenario: ADMIN acessa recurso de qualquer paróquia ou setor
- **WHEN** um usuário `ADMIN` executa uma operação sobre qualquer recurso
- **THEN** a operação é autorizada, sem restrição de paróquia ou setor
