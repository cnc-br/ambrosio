# Spec Delta

## Purpose

Define o escopo de paróquia para adicionar e remover carismas de uma pessoa, garantindo que cada `SECRETARIA_CNC` altere apenas pessoas sob sua responsabilidade.

## ADDED Requirements

### Requirement: Escopo de paróquia na atualização de carismas de pessoa

O sistema SHALL permitir que `SECRETARIA_CNC` adicione ou remova carismas por `POST /carismas/pessoa/:pessoaId` apenas para pessoas com vínculo ativo em uma das suas paróquias. `ADMIN` SHALL manter a operação irrestrita. Pessoa sem vínculo ativo SHALL ser considerada no escopo.

#### Scenario: SECRETARIA_CNC adiciona carismas a pessoa da própria paróquia

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /carismas/pessoa/:pessoaId` com `carismaIds` para uma pessoa com vínculo ativo em comunidade da paróquia X
- **THEN** o sistema responde 201 e os carismas são adicionados

#### Scenario: SECRETARIA_CNC remove carismas de pessoa da própria paróquia

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /carismas/pessoa/:pessoaId` com uma lista de `carismaIds` que exclui carismas já vinculados à pessoa, e a pessoa tem vínculo ativo em comunidade da paróquia X
- **THEN** o sistema responde 201 e os carismas ausentes da lista são removidos

#### Scenario: SECRETARIA_CNC adiciona carismas a pessoa sem vínculo ativo

- **WHEN** um usuário `SECRETARIA_CNC` envia `POST /carismas/pessoa/:pessoaId` para uma pessoa sem nenhum vínculo ativo com comunidade
- **THEN** o sistema responde 201 e os carismas são adicionados

#### Scenario: SECRETARIA_CNC adiciona carismas a pessoa fora do escopo

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /carismas/pessoa/:pessoaId` para uma pessoa cujo vínculo ativo está na paróquia Y
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem adicionar carismas

#### Scenario: SECRETARIA_CNC remove carismas de pessoa fora do escopo

- **WHEN** um usuário `SECRETARIA_CNC` vinculado à paróquia X envia `POST /carismas/pessoa/:pessoaId` para uma pessoa cujo vínculo ativo está na paróquia Y, com uma lista de `carismaIds` que exclui carismas já vinculados
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem remover carismas

#### Scenario: ADMIN adiciona e remove carismas

- **WHEN** um usuário `ADMIN` autenticado envia `POST /carismas/pessoa/:pessoaId` para uma pessoa existente
- **THEN** o sistema responde 201 e os carismas são atualizados, sem restrição de escopo

#### Scenario: Pessoa inexistente na atualização de carismas

- **WHEN** um usuário com permissão envia `POST /carismas/pessoa/:pessoaId` com um id de pessoa inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, sem alterar carismas

#### Scenario: Perfil sem permissão de atualização de pessoa

- **WHEN** um usuário autenticado sem permissão de atualização de pessoa envia `POST /carismas/pessoa/:pessoaId`
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403, sem alterar carismas
