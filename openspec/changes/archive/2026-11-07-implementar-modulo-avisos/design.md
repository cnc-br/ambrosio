# Design

## Context

A API (NestJS + Prisma + PostgreSQL) não tem estrutura para avisos. O módulo `configuracoes` organiza submódulos homogêneos (`src/configuracoes/<submodulo>/` com controller/service/module/dto), enquanto o módulo `maintenance` provê infraestrutura de jobs agendados com rastreamento (`MaintenanceService.runTracked` + histórico `ScheduledJobExecution`), já especificada em `manutencao`. Guards de autenticação (`AuthGuard`/`RoleGuard`) e CASL são aplicados por controller/método — não há guard global. O `PaginationInterceptor` é global e envolve respostas no envelope `{ server, total, page, limit, data }`; o `PrismaExceptionsFilter` mapeia `P2025` (registro não encontrado) para `404`. Motivação: ver `proposal.md — Why`.

## Goals / Non-Goals

**Goals:**
- Persistir avisos (`texto` + `dataFim`) na tabela `aviso` do schema `ambrosio` via migration Prisma.
- Expor o CRUD sem `DELETE`: `POST`/`PATCH` restritos a `ADMIN`, `GET` públicos (exibição no front).
- Remover automaticamente avisos vencidos via novo job no módulo `maintenance`, rastreado pela infraestrutura existente.
- Testabilidade: unitários + e2e, seguindo o TDD do repositório.

**Non-Goals:**
- Rota manual de exclusão (`DELETE`).
- Notificação/push aos usuários quando um aviso é criado.
- Avisos multilíngue, anexos ou agendamento futuro de publicação (`dataInicio`).
- Segmentação de avisos por paróquia/comunidade (sem relação nesse momento).

## Decisions

### 1. Model Prisma `aviso`

```prisma
model aviso {
  id        Int      @id @default(autoincrement())
  texto     String   @db.Text
  dataFim   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@index([dataFim])
}
```

- Nome singular minúsculo igual aos demais modelos de negócio (`pais`, `estado`, `cidade`) — sem `@@map`.
- `texto` como `@db.Text` (mensagens podem ser longas), `dataFim` obrigatória (todo aviso tem prazo), timestamps seguindo a convenção do repositório.
- `@@index([dataFim])` barateia o `deleteMany` do job.
- **Alternativa considerada**: `cuid()`/UUID como `user`. Rejeitado: entidades de configuração usam `Int` autoincremento; UUID não agrega valor aqui.

### 2. Submódulo `src/configuracoes/avisos`

Estrutura espelhando `pais`/`estado`:

- `avisos.module.ts` → `AvisosModule` (declara controller, providers service), importado em `ConfiguracoesModule`.
- `avisos.controller.ts` → prefixo `@Controller('avisos')`, `@ApiTags('Avisos')`.
- `avisos.service.ts` → injeta `PrismaService`.
- `dto/create-aviso.dto.ts` e `dto/update-aviso.dto.ts`.

Rotas:

| Método | Rota | Acesso | Ação |
|---|---|---|---|
| `POST` | `/avisos` | `AuthGuard` + `RoleGuard` + `RequiredRoles(ADMIN)` | `prisma.aviso.create` |
| `GET` | `/avisos` | público (sem guards) | `prisma.aviso.findMany({ orderBy: { dataFim: 'desc' } })` |
| `GET` | `/avisos/:id` | público (sem guards) | `prisma.aviso.findUniqueOrThrow` |
| `PATCH` | `/avisos/:id` | `AuthGuard` + `RoleGuard` + `RequiredRoles(ADMIN)` | `prisma.aviso.update` |

- Guards aplicados **por método** (e não no controller inteiro) porque os `GET` são públicos e os de escrita restritos — o repositório já usa guards por handler quando necessário.
- `findUniqueOrThrow`/`update` delegam o `404` ao `PrismaExceptionsFilter` (`P2025` → `404`), mesma estratégia do `PaisService`.
- **Alternativa considerada**: aplicar guards no controller e marcar `GET` como `@Public()`. Rejeitado por ausência de guard global/decorator `@Public` no código atual.
- **Alternativa considerada** (GET público sem CASL): como a consulta pública é feita sem usuário, não há checagem CASL nesses handlers — apenas auth/RBAC nos de escrita, consistente com a instrução do usuário.

### 3. Ordenação e envelope

- `GET /avisos` ordena por `dataFim` decrescente (os avisos mais urgentes/novos primeiro). O `PaginationInterceptor` global entrega o envelope padrão; o front pode usar `data` diretamente.
- Array vazio → `data: []`, sem erro.

### 4. DTOs e validação

- `CreateAvisoDto`: `@IsString() @IsNotEmpty() texto: string` e `@IsDateString() dataFim: string` (ISO-8601). O `ValidationPipe` global (sem `transform` explícito) valida os formatos; Prisma aceita string ISO-8601 para `DateTime`.
- `UpdateAvisoDto = PartialType(CreateAvisoDto)` — `class-validator` e `@nestjs/mapped-types` já existem no projeto.
- **Alternativa considerada**: `dataFim` como `Date` com `transform: true`. Rejeitado por mudança no pipe global; string ISO-8601 já resolve.

### 5. Job de expiração no módulo `maintenance`

- `src/maintenance/jobs/aviso-expiration.job.ts`:

```ts
export const AVISO_EXPIRATION_JOB_NAME = 'aviso-expiration';

@Cron('0 * * * *', { timeZone: 'America/Sao_Paulo' }) // horário de Brasília
async execute(): Promise<void> {
  await this.maintenanceService.runTracked(AVO_EXPIRATION_JOB_NAME, async () => {
    const { count } = await this.prisma.aviso.deleteMany({
      where: { dataFim: { lt: new Date() } },
    });
    // log do total removido
  });
}
```

- **Decisão — frequência horária** (`0 * * * *`): janela máxima de 1h entre o término do aviso e a remoção, razoável para exibição pública. **Assunção registrada** (o usuário não fixou frequência).
- O job injeta `PrismaService` e `MaintenanceService`; a rotina apenas faz o `deleteMany` e deixa todo o rastreamento (`RUNNING`/`SUCCESS`/`FAILED`) para o `runTracked`, como o `ExampleJob`.
- Registrar `AvisoExpirationJob` nos `providers` do `MaintenanceModule`.
- **Alternativa considerada**: incluir a rotina dentro do `MaintenanceService`. Rejeitado: acopla manutenção ao domínio de avisos; o job como orquestrador mantém o serviço singleton e genérico.

### 6. Testes

- **Unit (service)**: `create` persiste `texto`/`dataFim`; `findAll` ordena por `dataFim` desc; `findOne`/`update` com Prisma mockado.
- **Unit (controller)**: `POST`/`PATCH` só passam com `ADMIN` (metadados `RequiredRoles` + guards ativos em teste, como `maintenance.controller.spec.ts`); `GET` sem guard.
- **Unit (job)**: metadados de cron (`SCHEDULE_CRON_OPTIONS`) com `timeZone: America/Sao_Paulo`; delega ao `runTracked`; rotina chama `deleteMany` com `dataFim < now`.
- **E2E**: `GET /avisos` e `GET /avisos/:id` sem token → `200`; `POST`/`PATCH` sem token → `401` e com usuário não-`ADMIN` → `403`; cadastro/atualização/consulta felizes; `DELETE /avisos/:id` sem rota; migração aplicada.

## Risks / Trade-offs

- **Janela de expiração de até 1h** com cron horário → Aviso pode permanecer visível até 1h após `dataFim`. Mitigação: frequência horária é negócio aceitável; se necessário, reduzir o cron sem alterar a spec.
- **`PATCH` com transformo automático de string para `Date`**: Prisma faz a conversão da string ISO; risco de `400` em formatos inválidos → `@IsDateString()` valida antes.
- **Rolling no cron e horário de verão**: `America/Sao_Paulo` (sem DST desde 2019) → frequência estável.
- **Consulta pública expõe avisos sem autenticação** → Apenas conteúdo de aviso (texto público) é exposto; risco mínimo, porém consciente da decisão do usuário.

## Migration Plan

1. `npx prisma migrate dev --name create_table_aviso` → gera a migration e o cliente Prisma atualizado.
2. Implementação TDD do submódulo `avisos`; `npm run test` e `npm run test:e2e`.
3. Job registrado; verificação no ambiente local via histórico `GET /maintenance/executions`.
4. **Rollback**: `npx prisma migrate dev` para a migração anterior (`create_scheduled_job_executions`) recria o estado; código antigo segue compatível pois nada existente é alterado.
