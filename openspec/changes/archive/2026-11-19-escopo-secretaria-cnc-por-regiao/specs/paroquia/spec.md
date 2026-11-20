# Spec Delta

## ADDED Requirements

### Requirement: Gestão de paróquias por região do SECRETARIA_CNC

O sistema SHALL permitir que `SECRETARIA_CNC` crie, atualize e exclua paróquias apenas quando o setor da paróquia pertencer a uma das regiões vinculadas ao usuário em `usuarioRegiao`. `ADMIN` SHALL manter a gestão irrestrita e `SECRETARIA_PAROQUIA` SHALL ser rejeitado com 403.

#### Scenario: SECRETARIA_CNC cria paróquia em setor da própria região
- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /paroquia` com `setor.id` de um setor pertencente a uma das suas regiões
- **THEN** o sistema responde 201 e a paróquia é criada nesse setor

#### Scenario: SECRETARIA_CNC cria paróquia em setor de outra região
- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /paroquia` com `setor.id` de um setor fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar a paróquia

#### Scenario: SECRETARIA_CNC atualiza paróquia da própria região
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` para uma paróquia cujo setor pertence a uma das suas regiões
- **THEN** o sistema responde 200 e a paróquia é atualizada

#### Scenario: SECRETARIA_CNC atualiza paróquia de outra região
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` para uma paróquia cujo setor está fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar a paróquia

#### Scenario: SECRETARIA_CNC exclui paróquia de outra região
- **WHEN** um usuário `SECRETARIA_CNC` envia `DELETE /paroquia/:id` para uma paróquia cujo setor está fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem excluir a paróquia

#### Scenario: SECRETARIA_PAROQUIA tenta gerenciar paróquia
- **WHEN** um usuário `SECRETARIA_PAROQUIA` envia uma rota de escrita de paróquia
- **THEN** o sistema responde 403, pois a gestão de paróquias é exclusiva de `ADMIN` e `SECRETARIA_CNC`

#### Scenario: ADMIN gerencia paróquia de qualquer região
- **WHEN** um usuário `ADMIN` cria, atualiza ou exclui uma paróquia de uma região arbitrária
- **THEN** o sistema executa a operação sem restrição de região

### Requirement: Movimentação de paróquia restrita à região do SECRETARIA_CNC

O sistema SHALL permitir que `SECRETARIA_CNC` altere o setor de uma paróquia apenas quando o setor de destino também pertencer a uma das suas regiões. A movimentação para setor de outra região SHALL ser rejeitada com 403 sem alterar a paróquia.

#### Scenario: SECRETARIA_CNC move paróquia para setor da própria região
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` com `setor.id` de outro setor pertencente às suas regiões
- **THEN** o sistema responde 200 e a paróquia passa a pertencer ao novo setor

#### Scenario: SECRETARIA_CNC move paróquia para setor de outra região
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` com `setor.id` de um setor fora das suas regiões
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar o setor da paróquia

#### Scenario: Setor de destino inexistente
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` com `setor.id` inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Setor' não foi encontrado.` e `statusCode` 404
