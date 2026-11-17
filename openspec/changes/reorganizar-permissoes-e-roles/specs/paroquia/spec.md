# Spec Delta

## ADDED Requirements

### Requirement: Gestão de paróquias pelo SECRETARIA_CNC

O sistema SHALL permitir que o perfil `SECRETARIA_CNC` crie, atualize e exclua paróquias, restrito às paróquias cujo `setor` esteja vinculado a ele em `usuarioSetor`. O `ADMIN` SHALL manter a gestão irrestrita e o `SECRETARIA_PAROQUIA` SHALL NOT ter permissão de gestão de paróquias.

#### Scenario: SECRETARIA_CNC cadastra paróquia no próprio setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `POST /paroquia` com `setor.id` igual a S
- **THEN** o sistema responde 201 e a paróquia é criada no setor S

#### Scenario: SECRETARIA_CNC cadastra paróquia em setor não vinculado
- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /paroquia` com `setor.id` de um setor não vinculado a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem criar a paróquia

#### Scenario: SECRETARIA_CNC atualiza paróquia do próprio setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `PATCH /paroquia/:id` para uma paróquia do setor S
- **THEN** o sistema responde 200 e a paróquia é atualizada

#### Scenario: SECRETARIA_CNC atualiza paróquia de setor não vinculado
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` para uma paróquia de um setor não vinculado a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem atualizar a paróquia

#### Scenario: SECRETARIA_CNC move paróquia para setor não vinculado
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` alterando o `setor.id` para um setor não vinculado a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar o setor da paróquia

#### Scenario: SECRETARIA_CNC exclui paróquia do próprio setor
- **WHEN** um usuário `SECRETARIA_CNC` vinculado ao setor S envia `DELETE /paroquia/:id` para uma paróquia do setor S
- **THEN** o sistema responde 200 e a paróquia é excluída

#### Scenario: SECRETARIA_CNC exclui paróquia de setor não vinculado
- **WHEN** um usuário `SECRETARIA_CNC` envia `DELETE /paroquia/:id` para uma paróquia de um setor não vinculado a ele
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem excluir a paróquia

#### Scenario: Paróquia inexistente na gestão
- **WHEN** um usuário `SECRETARIA_CNC` envia `PATCH /paroquia/:id` ou `DELETE /paroquia/:id` com um id de paróquia inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Paroquia' não foi encontrado.` e `statusCode` 404

#### Scenario: SECRETARIA_PAROQUIA não gerencia paróquias
- **WHEN** um usuário `SECRETARIA_PAROQUIA` envia `POST /paroquia`, `PATCH /paroquia/:id` ou `DELETE /paroquia/:id`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para <ação> paroquia` e `statusCode` 403

#### Scenario: ADMIN gerencia paróquia fora dos próprios setores
- **WHEN** um usuário `ADMIN` envia `POST /paroquia`, `PATCH /paroquia/:id` ou `DELETE /paroquia/:id`
- **THEN** a operação é autorizada sem restrição de setor
