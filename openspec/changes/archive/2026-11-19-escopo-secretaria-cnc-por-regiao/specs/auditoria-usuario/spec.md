# Spec Delta

## MODIFIED Requirements

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
