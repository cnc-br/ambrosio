# Tasks

## 1. Modelo Prisma e migration

- [x] 1.1 Adicionar ao `prisma/schema.prisma` o enum `ScheduledJobStatus` (`RUNNING`, `SUCCESS`, `FAILED`, mapeado para `scheduled_job_status`) e o modelo `ScheduledJobExecution` com os campos e índices do design (D1). Verificar: `npx prisma validate` passa.
- [x] 1.2 Gerar a migration com `npx prisma migrate dev --name create_scheduled_job_executions`. Verificar: o SQL criado contém o tipo enum, a tabela `scheduled_job_executions`, os índices `[jobName, startedAt]` e `[startedAt]`, e a migration é aplicada sem erro.
- [x] 1.3 Confirmar que o client regenerado expõe `prisma.scheduledJobExecution`, `prisma.scheduledJobExecution.deleteMany` e o enum `ScheduledJobStatus`. Verificar: `npm run generate` conclui e um arquivo de teste temporário/`grep` no client gerado encontra os símbolos; nenhum arquivo temporário permanece ao final.

## 2. MaintenanceService (TDD)

- [x] 2.1 Escrever teste unitário de `startExecution(jobName)` que espera `create` com status `RUNNING`, `jobName` e retorno da entidade criada; implementar o método até o teste passar. Verificar: `npx vitest run src/maintenance/maintenance.service.spec.ts` verde.
- [x] 2.2 Escrever teste de `finishSuccess(id, startedAt)` esperando `update` para `SUCCESS`, `finishedAt` preenchido e `durationMs >= 0` coerente com o intervalo; implementar até passar. Verificar: teste verde e duração calculada a partir do `startedAt` persistido (D3).
- [x] 2.3 Escrever teste de `finishFailure(id, startedAt, error)` esperando `FAILED`, `finishedAt`, `durationMs` e mensagem de erro truncada em 1.000 caracteres, sem stack trace; implementar até passar. Verificar: teste verde, incluindo caso de erro não-`Error` (`String(error)`).
- [x] 2.4 Escrever testes de `runTracked(jobName, routine)` para: sucesso (registro final `SUCCESS`); falha da rotina (registro `FAILED` e erro original relançado); falha da rotina + falha do `finishFailure` (erro original preservado e relançado, falha de persistência logada); falha do `startExecution` (rotina não executa e erro é propagado). Implementar até passar. Verificar: `npx vitest run src/maintenance/maintenance.service.spec.ts` verde.
- [x] 2.5 Escrever testes de `findAll(page, limit)` esperando `skip`/`take` corretos, `orderBy: { startedAt: 'desc' }` e defaults `page=1`/`limit=50`; e de `deleteHistory()` esperando `deleteMany` restrito a `SUCCESS`/`FAILED` e retorno de `{ deleted: count }` (D6, D7). Implementar até passar. Verificar: teste verde e nenhuma chamada de delete sem filtro de status.

## 3. Controller, DTO, módulo e Swagger

- [x] 3.1 Criar `FindAllExecutionsQueryDto` com `page` e `limit` opcionais, `@Type(() => Number)`, `@IsInt` e `@Min(1)`, seguindo `FindAllParoquiasQueryDto`; adicionar teste unitário de validação (valores válidos aceitos, `0`/texto rejeitados). Verificar: teste verde.
- [x] 3.2 Implementar `MaintenanceController` com `GET /maintenance/executions` e `DELETE /maintenance/executions`, `@UseGuards(AuthGuard, RoleGuard)` e `@RequiredRoles(UserRoleEnum.ADMIN)`; escrever teste unitário do controller verificando delegação ao service e metadata de papel `ADMIN` nos dois handlers. Verificar: teste verde.
- [x] 3.3 Documentar os endpoints no Swagger com `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiUnauthorizedResponse`, `@ApiForbiddenResponse`, parâmetros `page`/`limit` e aviso explícito de operação destrutiva no `DELETE`. Verificar: `npm run build` compila e as anotações estão presentes no controller.
- [x] 3.4 Criar `MaintenanceModule` com controller/service/job em `providers`/`controllers` e importá-lo no `AppModule`; confirmar que `ScheduleModule.forRoot()` continua aparecendo uma única vez no projeto. Verificar: `grep -rn "ScheduleModule.forRoot" src` retorna uma ocorrência e `npm run build` compila.

## 4. Job demonstrativo

- [x] 4.1 Escrever teste unitário de `ExampleJob` verificando: metadata `@Cron` com expressão `0 0 2 * * *` e `timeZone: 'America/Sao_Paulo'`; chamada a `runTracked('example', ...)`; log de início e de resultado; e que a rotina demonstrativa não chama nenhum método de escrita de dados de negócio. Verificar: teste verde (teste falha antes da implementação).
- [x] 4.2 Implementar `jobs/example.job.ts` com `Logger` nativo do NestJS, rotina demonstrativa sem escrita de negócio e rastreabilidade delegada ao `MaintenanceService` (D9); registrar o job em `MaintenanceModule`. Verificar: `npx vitest run src/maintenance/jobs/example.job.spec.ts` verde.
- [x] 4.3 Documentar no JSDoc de `runTracked` e no exemplo do job como adicionar novas tarefas reutilizando a rastreabilidade centralizada. Verificar: o exemplo compila e corresponde ao fluxo implementado (D2).

## 5. Integração e verificação final

- [x] 5.1 Criar `test/maintenance.e2e-spec.ts` seguindo `testes-e2e`: 401 sem token no GET/DELETE, 403 com usuário autenticado não-admin, 200 no GET com envelope `{ server, total, page, limit, data }` e ordenação decrescente, e 200 no DELETE retornando `{ deleted }`. Verificar: `npm run test:e2e` verde.
- [x] 5.2 No e2e de DELETE, inserir um registro `SUCCESS`, um `FAILED` e um `RUNNING`; após a exclusão, confirmar que os dois primeiros foram removidos, o `RUNNING` permaneceu e uma tabela de negócio (ex.: `comunidade`) manteve sua contagem. Verificar: `npm run test:e2e` verde.
- [x] 5.3 Rodar a suíte completa e o lint: `npm run test`, `npm run test:e2e`, `npm run lint` e `npm run build`. Verificar: todos os comandos concluem sem erros e nenhum teste existente regrediu.

## Workflow follow-up

- Revisar os artefatos e, quando solicitado, iniciar a implementação pelo fluxo de apply.
- Após a implementação e revisão, arquivar a mudança.
