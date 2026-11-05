# Design

## Context

Ver `proposal.md` — Why. O estado atual relevante:

- O `@nestjs/schedule` já está em `package.json` (^12.0.2) e o `ScheduleModule.forRoot()` já está registrado uma única vez em `src/app.module.ts`. Não há nenhum `@Cron` em uso.
- O projeto organiza módulos diretamente em `src/<modulo>` (não em `src/modules`), com controllers, services, `dto/` e specs ao lado. Módulos de domínio importam `PrismaService` do módulo global.
- A autenticação usa `AuthGuard` (JWT) + `RoleGuard` com `@RequiredRoles(...)`; o papel `ADMIN` é o que pode tudo. CASL (`PermissionResource`) cobre apenas recursos de negócio.
- `PaginationInterceptor` é global e envolve toda resposta em `{ server, total, page, limit, data }`; hoje o `total` reflete o tamanho da página retornada. `PessoaService.findAll` é o exemplo de paginação via `skip`/`take` com `page`/`limit`.
- O cliente Prisma é gerado em `generated/` e exposto por `src/prisma/generated-client.js`; o schema usa `@@map` quando o nome físico difere.
- O `DELETE /users/:id` já usa `@Res()` para responder `204`; para o histórico, porém, o requisito é retornar a quantidade excluída, então a resposta será um corpo JSON.

## Goals / Non-Goals

**Goals:**

- Centralizar o ciclo de vida de rastreabilidade em um único ponto reutilizável por qualquer job.
- Garantir que `finishedAt` e `durationMs` sejam gravados tanto em sucesso quanto em falha, sem mascarar o erro original.
- Manter o padrão existente de módulos, DTOs de query, guards, logs e testes.
- Não introduzir infraestrutura nova.

**Non-Goals:**

- Locks, filas, retries ou execução distribuída (premissa de instância única).
- Filtros por `jobName`/`status` nesta entrega — o DTO de query fica preparado para recebê-los depois.
- Alterar dados de negócio a partir do job demonstrativo.
- Refatorar o `PaginationInterceptor` ou outros módulos.

## Decisions

**D1 — Modelo `ScheduledJobExecution` e enum `ScheduledJobStatus`.**

Adicionar ao `prisma/schema.prisma`:

```prisma
enum ScheduledJobStatus {
  RUNNING
  SUCCESS
  FAILED

  @@map("scheduled_job_status")
}

model ScheduledJobExecution {
  id         String             @id @default(uuid())
  jobName    String
  status     ScheduledJobStatus
  startedAt  DateTime           @default(now())
  finishedAt DateTime?
  durationMs Int?
  error      String?            @db.Text

  @@index([jobName, startedAt])
  @@index([startedAt])
  @@map("scheduled_job_executions")
}
```

_Rationale_: segue a sugestão da demanda, usa enum nativo para impedir status inválido e `@db.Text` para a mensagem de erro. A migration é gerada com `npx prisma migrate dev --name create_scheduled_job_executions`, como as demais alterações estruturais. Alternativa rejeitada: `status String` (aceita valores arbitrários).

**D2 — Centralizar rastreabilidade em `MaintenanceService.runTracked(jobName, routine)`.**

O serviço expõe o fluxo completo, e os jobs apenas chamam esse método:

```ts
async runTracked<T>(jobName: string, routine: () => Promise<T>): Promise<T>
```

Internamente:

1. `startExecution(jobName)` cria o registro `RUNNING` e devolve a entidade (incluindo `startedAt`).
2. Executa `routine()`.
3. `finishSuccess(id, startedAt)` atualiza para `SUCCESS`, `finishedAt` e `durationMs`.
4. Em erro, `finishFailure(id, startedAt, error)` atualiza para `FAILED` com os mesmos campos e a mensagem sanitizada.

Os métodos `startExecution`, `finishSuccess` e `finishFailure` também ficam públicos para testes e para usos pontuais, mas os jobs não devem duplicar o `try/catch` de rastreabilidade. Alternativa rejeitada: um decorator/interceptor por job — funciona, mas esconde o fluxo e dificulta o teste unitário direto.

**D3 — Duração calculada com o `startedAt` persistido.**

`durationMs = Math.max(0, Date.now() - startedAt.getTime())`. Usar o `startedAt` devolvido pelo `create` evita uma segunda leitura do registro e garante que o valor corresponde ao que foi gravado. Alternativa rejeitada: calcular no banco com `now()` — depende do relógio do banco e complica o teste unitário.

**D4 — Separar falha da rotina de falha da persistência.**

`runTracked` usa `try/catch` em torno da rotina. No `catch`:

- tenta `finishFailure`; se essa atualização também falhar, loga o erro de persistência com o `jobName` e o `id`, **preserva o erro original** e o relança;
- se a atualização funcionar, loga o erro da rotina com contexto e relança o erro original para que o scheduler também o registre (sem engolir exceção).

A mensagem persistida usa `error instanceof Error ? error.message : String(error)`, truncada em 1.000 caracteres, sem stack trace, payloads ou credenciais. Se `startExecution` falhar, a rotina não executa e o erro é propagado. Alternativa rejeitada: silenciar o erro no job demonstrativo — viola o requisito de não mascarar falhas.

**D5 — Autorização por papel, sem novo subject CASL.**

Ambos os endpoints usam `@UseGuards(AuthGuard, RoleGuard)` e `@RequiredRoles(UserRoleEnum.ADMIN)` no controller. Não se cria recurso em `PermissionResource` porque o histórico de manutenção não é dado de negócio e a decisão do usuário foi restringir a `ADMIN`. Alternativa rejeitada: modelar `maintenance` no CASL — exigiria alterar tipos e regras de todos os papéis sem ganho nesta entrega.

**D6 — Paginação no padrão de `PessoaService.findAll`.**

`FindAllExecutionsQueryDto` (em `dto/`) valida `page` e `limit` opcionais com `@Type(() => Number)`, `@IsInt` e `@Min(1)`; o service aplica `PAGE_DEFAULT`/`LIMIT_DEFAULT`, `skip = (page - 1) * limit`, `take = limit` e `orderBy: { startedAt: 'desc' }`. O `PaginationInterceptor` global monta o envelope. O DTO não implementa `jobName`/`status` agora, mas é o ponto natural para adicioná-los depois. Alternativa rejeitada: paginar em memória — desperdiça banco e diverge do padrão.

**D7 — `DELETE` remove somente execuções concluídas.**

`deleteMany({ where: { status: { in: ['SUCCESS', 'FAILED'] } } })` remove o histórico e preserva registros `RUNNING`, para que uma execução em andamento consiga finalizar seu próprio registro sem erro de “registro não encontrado”. A resposta é `{ deleted: count }`. O endpoint é documentado no Swagger como operação destrutiva do histórico, sem tocar em tabelas de negócio. Alternativa rejeitada: `deleteMany({})` — apagaria o registro de um job em execução e quebraria a finalização.

**D8 — Reutilizar o `ScheduleModule` já registrado.**

Não adicionar outro `ScheduleModule.forRoot()`. O `MaintenanceModule` declara `ExampleJob` em `providers` e é importado no `AppModule`; o scheduler descoberto pelo `forRoot()` existente registra o `@Cron`. O job usa:

```ts
@Cron('0 0 2 * * *', { timeZone: 'America/Sao_Paulo' })
```

Alternativa rejeitada: importar `ScheduleModule.forRoot()` no `MaintenanceModule` — inicialização duplicada.

**D9 — Job demonstrativo sem escrita de negócio.**

`ExampleJob` injeta `MaintenanceService`, usa `Logger` nativo do NestJS e chama `runTracked('example', async () => { ... })`. A rotina apenas registra uma mensagem de log (e pode executar uma verificação em memória); a única escrita é o próprio histórico de execução. Alternativa rejeitada: reutilizar uma rotina de negócio existente — violaria “sem modificar dados reais”.

**D10 — Sem DTO de resposta.**

O projeto não usa DTOs de resposta (`ApiProperty`/`*ResponseDto`); a documentação Swagger é feita com `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiUnauthorizedResponse`, `@ApiForbiddenResponse` etc. Seguir esse padrão evita introduzir uma convenção nova.

## Risks / Trade-offs

- **Cronograma depende do relógio do processo** → o fuso é explícito no `@Cron`; a premissa de instância única evita execuções concorrentes.
- **Histórico cresce sem limite** → índices em `jobName + startedAt` e `startedAt` mantêm a consulta ordenada eficiente; o endpoint `DELETE` permite limpeza administrativa. Uma política de retenção automática fica fora de escopo.
- **`total` do envelope reflete a página, não o total global** → comportamento herdado do interceptor existente; corrigi-lo agora afetaria todos os módulos e não é necessário para a aceitação.
- **Exclusão concorrente com uma execução** → mitigada por preservar `RUNNING`; a execução finaliza normalmente e passa a ser elegível a exclusões futuras.
- **Falha ao gravar o histórico** → logada separadamente e o erro original é relançado; a rotina nunca é executada sem o registro `RUNNING` inicial.
- **Migration em ambiente com dados** → a tabela é nova e o enum também; não há backfill nem alteração de tabelas existentes.

## Migration Plan

1. `npx prisma migrate dev --name create_scheduled_job_executions` (cria enum + tabela e regenera o client).
2. Em deploy, `npm run migrate:deploy` (já existente no projeto) aplica a migration e roda `prisma generate`.
3. Rollback: `DROP TABLE "scheduled_job_executions"` e `DROP TYPE "scheduled_job_status"`; nenhum dado de negócio é afetado.

## Open Questions

Nenhuma pendente. As decisões de autorização (ambos os endpoints só `ADMIN`) e de preservação de registros `RUNNING` no `DELETE` estão fechadas neste design.
