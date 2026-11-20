# Auditoria Usuario Specification

## Purpose

Garante que toda criação e edição de registros em qualquer tabela registre o usuário autenticado que executou a ação, seguindo o padrão do model `pessoa`, e que novos modelos já nasçam com os campos de auditoria.

## Requirements

### Requirement: Campos de auditoria em todas as tabelas

O sistema SHALL possuir, em toda tabela com exceção de `user`, `usuarioParoquia`, `usuarioRegiao`, `ScheduledJobExecution` e `ScheduledJobStatus` (enum), os campos `cadastradoPorId` e `atualizadoPorId` (FK opcional para `user`, com índices e remoção em cascata para `NULL`), além de `createdAt` e `updatedAt` quando não existirem.

#### Scenario: Tabela existente sem auditoria recebe os campos

- **WHEN** uma tabela existente (por exemplo `comunidade`) não possui `cadastradoPorId`, `atualizadoPorId`, `createdAt` e `updatedAt`
- **THEN** a tabela passa a possuir os quatro campos no padrão do model `pessoa`, sem perda dos registros existentes

#### Scenario: Tabela com timestamps existentes recebe apenas a auditoria

- **WHEN** uma tabela (por exemplo `diocese`) já possui `createdAt` e `updatedAt`
- **THEN** apenas `cadastradoPorId` e `atualizadoPorId` são adicionados

#### Scenario: Tabelas excluídas não recebem auditoria

- **WHEN** as tabelas `user`, `usuarioParoquia`, `usuarioRegiao` e `ScheduledJobExecution` são inspecionadas
- **THEN** nenhuma delas possui `cadastradoPorId` nem `atualizadoPorId`

#### Scenario: Campos auditáveis são opcionais no banco

- **WHEN** um registro é criado sem usuário autenticado (por exemplo via seed)
- **THEN** `cadastradoPorId` e `atualizadoPorId` são persistidos como `NULL` sem violar a integridade

### Requirement: Registro da autoria em rotas de escrita autenticadas

O sistema SHALL gravar, em toda rota autenticada que cria ou atualiza um registro, o id do usuário autenticado em `cadastradoPorId` (criação) e em `atualizadoPorId` (criação e atualização).

#### Scenario: Criação registra o usuário autenticado

- **WHEN** um usuário autenticado com permissão cria um registro em uma rota de escrita (por exemplo `POST /comunidade`)
- **THEN** o registro é persistido com `cadastradoPorId` e `atualizadoPorId` iguais ao id do usuário autenticado

#### Scenario: Atualização registra o usuário autenticado

- **WHEN** um usuário autenticado com permissão atualiza um registro existente (por exemplo `PATCH /paroquia/:id`)
- **THEN** o registro passa a ter `atualizadoPorId` igual ao id do usuário autenticado e `cadastradoPorId` permanece inalterado

#### Scenario: Atualização malsucedida preserva a autoria anterior

- **WHEN** uma atualização falha por registro inexistente ou falta de permissão
- **THEN** `atualizadoPorId` permanece com o valor anterior

### Requirement: Autoria não forjável pelo payload

O sistema SHALL ignorar `cadastradoPorId` e `atualizadoPorId` quando enviados no payload das rotas de escrita, persistindo apenas o usuário identificado no contexto autenticado da requisição.

#### Scenario: Payload tenta forjar a autoria

- **WHEN** o payload de uma rota de escrita contém `cadastradoPorId` ou `atualizadoPorId` com um valor arbitrário
- **THEN** o sistema ignora os valores do payload e persiste o id do usuário autenticado

### Requirement: Autoria opcional em rotas de escrita públicas

Em rotas de escrita que não exigem autenticação, o sistema SHALL registrar a autoria quando um token Bearer válido for enviado e SHALL permitir a criação com campos de auditoria `NULL` quando nenhum token for enviado, preservando o comportamento público atual.

#### Scenario: Token válido em rota pública registra autoria

- **WHEN** `POST /endereco/pessoa/:id` é chamado com um token Bearer válido
- **THEN** os registros criados (incluindo fluxos aninhados de `pais`, `estado`, `cidade` e `pessoaEndereco`) são persistidos com o id do usuário autenticado

#### Scenario: Sem token em rota pública mantém acesso e grava NULL

- **WHEN** `POST /endereco/pessoa/:id` é chamado sem token
- **THEN** a requisição é aceita como hoje e `cadastradoPorId` e `atualizadoPorId` são persistidos como `NULL`

### Requirement: Campos de auditoria não expostos nas respostas

O sistema SHALL NOT expor `cadastradoPorId` nem `atualizadoPorId` nos payloads de resposta de nenhum endpoint, mantendo os contratos de resposta atuais.

#### Scenario: Criação não expõe auditoria

- **WHEN** uma rota de escrita cria um registro com sucesso
- **THEN** o corpo da resposta não contém `cadastradoPorId` nem `atualizadoPorId`

#### Scenario: Consulta não expõe auditoria

- **WHEN** um registro é consultado por uma rota de leitura
- **THEN** o corpo da resposta não contém `cadastradoPorId` nem `atualizadoPorId`

### Requirement: Política de NULL para tabelas sem rota de escrita

Tabelas sem rota de escrita autenticada (populadas por seed, como `escolaridade`, `tipoLocalidade` e `setor`) SHALL manter `cadastradoPorId` e `atualizadoPorId` como `NULL` até existir rota autenticada que os preencha.

#### Scenario: Registro criado por seed mantém auditoria NULL

- **WHEN** o seed cria registros em tabelas sem rota de escrita
- **THEN** `cadastradoPorId` e `atualizadoPorId` desses registros permanecem `NULL`

#### Scenario: Futura rota de escrita passa a preencher a auditoria

- **WHEN** uma rota autenticada de escrita passa a existir para uma dessas tabelas
- **THEN** os novos registros criados pela rota passam a registrar `cadastradoPorId` e `atualizadoPorId`

### Requirement: Novas tabelas devem nascer com auditoria

Toda tabela criada no futuro SHALL incluir `cadastradoPorId`, `atualizadoPorId`, `createdAt` e `updatedAt` no padrão deste documento, salvo as exclusões previstas (tabelas de vínculo simples e de infraestrutura).

#### Scenario: Agente cria nova tabela com auditoria

- **WHEN** um agente ou desenvolvedor adiciona um novo model ao `prisma/schema.prisma` em conformidade com a regra documentada em `AGENTS.md`
- **THEN** o model já contém os quatro campos de auditoria e as relações com `user`
