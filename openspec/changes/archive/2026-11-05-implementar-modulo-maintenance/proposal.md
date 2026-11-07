# Proposal

## Why

A API não possui hoje um lugar comum para registrar e consultar a execução de tarefas agendadas. Sem rastreabilidade, falhas em rotinas automáticas passam silenciosas e não há histórico para diagnóstico. O `@nestjs/schedule` já está instalado e o `ScheduleModule.forRoot()` já é registrado uma única vez no `AppModule`, mas nenhum job o utiliza e não existe tabela de histórico.

## What Changes

- Criar a capability `manutencao` com o contrato de agendamento, rastreabilidade e consulta do histórico de execuções de jobs.
- Adicionar o modelo Prisma `ScheduledJobExecution` (tabela `scheduled_job_executions`) e o enum `ScheduledJobStatus` (`RUNNING`, `SUCCESS`, `FAILED`), com migration versionada.
- Criar o módulo `src/maintenance` (controller, service, DTOs e job demonstrativo), seguindo a organização existente em `src/<modulo>`.
- Centralizar o ciclo de vida da execução no `MaintenanceService`: registrar `RUNNING`, executar a rotina e finalizar como `SUCCESS` ou `FAILED`, sempre preenchendo `finishedAt` e `durationMs`.
- Expor `GET /maintenance/executions` com paginação no padrão da API (`page`/`limit`) e ordenação do mais recente para o mais antigo.
- Expor `DELETE /maintenance/executions` para limpar somente o histórico, retornando a quantidade excluída e sem interromper jobs em execução.
- Proteger os dois endpoints com `AuthGuard` + `RoleGuard`, exigindo o papel `ADMIN` (decisão confirmada pelo usuário).
- Adicionar job demonstrativo diário às 02:00 (`America/Sao_Paulo`) que não altera dados de negócio.
- Cobrir service, controller e job com testes unitários, e atualizar o Swagger.

Não há **BREAKING CHANGE**: os endpoints são novos e nenhum comportamento existente é alterado.

## Capabilities

### New Capabilities

- `manutencao`: Define o comportamento de tarefas agendadas de manutenção — agendamento em `America/Sao_Paulo`, rastreabilidade de início/fim de execução (sucesso e falha), consulta paginada do histórico e exclusão administrativa do histórico.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisito alterado. A capability `testes-e2e` continua orientando a forma dos novos testes, sem mudança de contrato. -->

## Impact

- **Código novo**: `src/maintenance/maintenance.module.ts`, `maintenance.controller.ts`, `maintenance.service.ts`, `dto/` e `jobs/example.job.ts`.
- **Código alterado**: `src/app.module.ts` (importar `MaintenanceModule`); `prisma/schema.prisma`.
- **Banco**: nova migration em `prisma/migrations/` criando o enum e a tabela `scheduled_job_executions`.
- **API**: novos endpoints `GET /maintenance/executions` e `DELETE /maintenance/executions`, ambos restritos a `ADMIN`.
- **Dependências**: nenhuma nova — `@nestjs/schedule` já está em `package.json` e `ScheduleModule.forRoot()` já está no `AppModule`.
- **Infraestrutura**: nenhuma adicional (sem Redis, BullMQ ou locks distribuídos); premissa de instância única.
- **Testes**: novos `*.spec.ts` em `src/maintenance/`; opcionalmente e2e em `test/maintenance.e2e-spec.ts` seguindo o padrão de `testes-e2e`.
