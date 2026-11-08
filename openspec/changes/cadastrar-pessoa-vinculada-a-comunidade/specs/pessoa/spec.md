# Spec Delta

## ADDED Requirements

### Requirement: Cadastro de pessoa vinculada a uma comunidade

O sistema DEVE aceitar, em `POST /pessoa`, o query param opcional `comunidadeId` (inteiro). Quando informado, o sistema DEVE validar **antes de qualquer criação** que a comunidade existe e está dentro do escopo de atualização do usuário (paróquias vinculadas em `usuarioParoquia`), e somente em caso de sucesso DEVE criar a pessoa e o vínculo dela com a comunidade.

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

#### Scenario: Cadastro sem comunidadeId

- **WHEN** um usuário envia `POST /pessoa` sem o query param `comunidadeId`
- **THEN** o sistema responde `201` com a pessoa criada, sem criar vínculo com comunidade
- **AND** o comportamento é idêntico ao cadastro atual

#### Scenario: comunidadeId não numérico

- **WHEN** um usuário envia `POST /pessoa?comunidadeId=abc`
- **THEN** o sistema responde `406` com `statusCode` 406
- **AND** nenhuma pessoa DEVE ser criada

### Requirement: Integridade do vínculo após a criação da pessoa

Quando o `comunidadeId` é validado com sucesso e a pessoa é criada, se a criação do vínculo com a comunidade falhar o sistema DEVE desfazer o cadastro local da pessoa recém-criada e repassar o erro, NÃO DEIXANDO pessoa cadastrada sem o vínculo solicitado.

#### Scenario: Falha na criação do vínculo após a pessoa criada

- **WHEN** a pessoa é criada com sucesso, mas a criação do vínculo `comunidadePessoa` falha
- **THEN** o cadastro local da pessoa recém-criada DEVE ser removido
- **AND** o erro DEVE ser propagado ao chamador
- **AND** nenhum vínculo parcial DEVE permanecer

#### Scenario: Vínculo criado com sucesso após a pessoa

- **WHEN** após a criação da pessoa o vínculo `comunidadePessoa` é criado com sucesso
- **THEN** a pessoa DEVE permanecer cadastrada
- **AND** o vínculo DEVE existir entre a pessoa e a comunidade informada
