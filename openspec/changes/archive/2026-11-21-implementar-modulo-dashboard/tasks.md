# Tasks

## 1. Base do módulo

- [x] 1.1 Criar `src/dashboard/dto/dashboard-response.dto.ts` com os tipos `PessoasIndicadorDto`, `CarismasIndicadorDto`, `UsuariosIndicadorDto` e `DashboardIndicadoresDto` (apenas documentação Swagger) e verificar que `npm run build` conclui sem erro de tipo
- [x] 1.2 Criar `src/dashboard/dashboard.module.ts` importando `CaslModule` e declarando `DashboardController`/`DashboardService`, e verificar que o módulo é resolvido no build (`npm run build`)

## 2. Cálculo dos indicadores (TDD)

- [x] 2.1 Escrever `src/dashboard/dashboard.service.spec.ts` com Prisma mockado cobrindo: contagem de pessoas por `ativo` com `total = ativas + inativas`, paróquias, dioceses, comunidades, equipes, carismas + vínculos, usuários por papel com todos os papéis presentes e base vazia retornando zeros; verificar que os testes falham antes da implementação (`npx vitest run src/dashboard/dashboard.service.spec.ts`)
- [x] 2.2 Implementar `DashboardService.getIndicators()` com as contagens independentes em `Promise.all`, `pessoa.groupBy` por `ativo`, `user.groupBy` por `role` e inicialização de `porPapel` percorrendo `Object.values(roles)` com zero; verificar que os testes de 2.1 passam
- [x] 2.3 Adicionar caso de teste em que uma contagem rejeita e verificar que `getIndicators()` propaga o erro sem devolver payload parcial

## 3. Cache em memória

- [x] 3.1 Escrever testes do cache com `vi.useFakeTimers()` cobrindo: segunda chamada dentro de 60s não repete as consultas ao Prisma, chamada após 60s recalcula, chamadas concorrentes compartilham o mesmo cálculo (coalescência) e erro limpa o cache para permitir nova tentativa; verificar que falham antes da implementação
- [x] 3.2 Implementar o cache no `DashboardService` (`cache`, `expiresAt`, `CACHE_TTL_MS = 60_000`, promise in-flight) sem guardar decisões de autorização; verificar que os testes de 3.1 e 2.x passam (`npx vitest run src/dashboard/dashboard.service.spec.ts`)

## 4. Controller, autorização e Swagger

- [x] 4.1 Escrever `src/dashboard/dashboard.controller.spec.ts` cobrindo: presença de `AuthGuard`/`RoleGuard`, 403 quando `ability.can('read','pessoa')` é falso, 200 quando é verdadeiro e delegação ao `DashboardService`; verificar que falha antes da implementação (`npx vitest run src/dashboard/dashboard.controller.spec.ts`)
- [x] 4.2 Implementar `DashboardController` com `@Get()` em `/dashboard`, checagem CASL `read pessoa` lançando `ForbiddenException` e `@ApiOkResponse` documentando o envelope `{ server, total, page, limit, data }`; verificar que os testes de 4.1 passam
- [x] 4.3 Importar `DashboardModule` em `src/app.module.ts` e verificar que `npm run build` conclui e a rota `GET /dashboard` aparece no Swagger gerado ao subir a aplicação

## 5. Integração e e2e

- [x] 5.1 Criar `test/dashboard.e2e-spec.ts` no padrão de `testes-e2e` cobrindo: `/dashboard (GET) - 401` sem token, `/dashboard (GET) - 403` com `ronaldinho@admin.com` (`NAO_IDENTIFICADO`), `/dashboard (GET) - 200` com `admin@admin.com` conferindo envelope e forma dos indicadores, ausência de dados pessoais e igualdade dos totais entre `ADMIN` e `secretaria@admin.com`; verificar com `npx vitest run --config ./vitest.config.e2e.ts test/dashboard.e2e-spec.ts` após `npm run seed`
- [x] 5.2 Rodar a suíte completa de unitários (`npm run test`) e o lint (`npm run lint`) e verificar que não há falhas nem erros de lint nos arquivos novos
- [x] 5.3 Rodar `openspec validate implementar-modulo-dashboard --strict` e verificar que o change está válido

## Workflow follow-up

- Arquivar o change após a revisão e o aceite do time.
- Verificar o resultado arquivado em `openspec/specs/dashboard/spec.md`.
