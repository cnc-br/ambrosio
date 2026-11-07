# Tasks

## 1. Banco de dados

- [x] 1.1 Adicionar o model `aviso` em `prisma/schema.prisma` com `id`, `texto` (`@db.Text`), `dataFim`, `createdAt`, `updatedAt` e `@@index([dataFim])`, e verificar `npx prisma format` sem alterações pendentes.
- [x] 1.2 Gerar a migration com `npx prisma migrate dev --name create_table_aviso` e verificar que a tabela `aviso` é criada e o cliente regenerado (`src/prisma/generated-client.ts`) compila.

## 2. Estrutura do submódulo `avisos`

- [x] 2.1 Criar `dto/create-aviso.dto.ts` (`texto` com `@IsString`/`@IsNotEmpty` e `dataFim` com `@IsDateString`) e `dto/update-aviso.dto.ts` via `PartialType`, e verificar testes de validação dos DTOs passando.
- [x] 2.2 Criar `avisos.module.ts`, `avisos.controller.ts` e `avisos.service.ts` em `src/configuracoes/avisos/`, importar `AvisosModule` no `ConfiguracoesModule`, e verificar que a aplicação compila/bootstra sem erro.

## 3. CRUD de avisos

- [x] 3.1 Implementar `POST /avisos` (service `create` + guard `ADMIN` via `AuthGuard`/`RoleGuard`/`RequiredRoles`) e verificar testes unitários do service (persiste `texto`/`dataFim`) e do controller (401 sem token, 403 sem `ADMIN`) passando.
- [x] 3.2 Implementar `GET /avisos` e `GET /avisos/:id` públicos (sem guards), com `findMany` ordenado por `dataFim` desc e `findUniqueOrThrow` para 404, e verificar testes unitários passando.
- [x] 3.3 Implementar `PATCH /avisos/:id` (service `update` + guard `ADMIN`) e verificar testes unitários (atualização parcial de `texto`/`dataFim`, 404 em id inexistente) passando.
- [x] 3.4 Escrever testes e2e cobrindo: `GET` público sem token retorna `200` com múltiplos avisos no envelope; `POST`/`PATCH` sem token → `401` e com usuário não-`ADMIN` → `403`; cadastro/leitura/atualização felizes; `GET /avisos/:id` inexistente → `404`; `DELETE /avisos/:id` sem rota; e verificar `npm run test:e2e` passando.

## 4. Expiração automática (módulo maintenance)

- [x] 4.1 Criar `src/maintenance/jobs/aviso-expiration.job.ts` com `@Cron` horário em `America/Sao_Paulo` executando via `MaintenanceService.runTracked` a rotina `deleteMany({ where: { dataFim: { lt: new Date() } } })`, registrar no `MaintenanceModule`, e verificar testes do job (metadados de cron com timezone; delegação ao `runTracked`; rotina exclui vencidos e preserva vigentes) passando.
- [x] 4.2 Verificar integração: executar a rotina do job e confirmar que avisos vencidos saem do `GET /avisos`, vigentes permanecem e a execução fica registrada no histórico de manutenção (`GET /maintenance/executions`) via teste de integração/e2e.

## 5. Verificação final

- [x] 5.1 Rodar `npm run test` e `npm run test:e2e` completos com sucesso e conferir que as rotas `/avisos` aparecem documentadas no Swagger (`/api`).

## Workflow follow-up

- Arquivar o change após revisão (`/opsx-archive`) e verificar o resultado arquivado.
