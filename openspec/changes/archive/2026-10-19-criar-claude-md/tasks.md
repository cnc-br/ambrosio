# Tasks

## 1. Visão geral da API

- [x] 1.1 Criar no `CLAUDE.md` a seção de visão geral com stack (NestJS, TypeScript, Prisma, Swagger, JWT) e porta (3005) e verificar que o arquivo existe na raiz e cita esses itens
- [x] 1.2 Documentar a arquitetura de módulos (`auth`, `pessoa`, `diocese`, `paroquia`, `mapa/*`, `configuracoes/*`, `users`, `comunidade`, `equipe`, `carisma`, `external/sao-pedro`, `health`) e verificar com `ls src/` que cada módulo citado existe

## 2. Autenticação e autorização

- [x] 2.1 Documentar o login JWT (`POST /auth/login`) e o formato do token e verificar a rota em `src/auth/auth.controller.ts`
- [x] 2.2 Documentar guards e decorators (`AuthGuard`, `OptionalAuthGuard`, `RoleGuard`, `@CurrentUser`, `@RequiredRoles`) e verificar que correspondem ao código em `src/auth/`
- [x] 2.3 Documentar a identificação opcional do usuário em rotas sem exigência de autenticação e as regras de proteção (401/403) e conferir contra a spec `openspec/specs/contexto-usuario/spec.md`

## 3. Convenções transversais

- [x] 3.1 Documentar `ValidationPipe` global, `PrismaExceptionsFilter`, paginação e logging com `requestId` (pino/ELK, Swagger em `/api`) e verificar a presença em `src/main.ts` e `src/app.module.ts`

## 4. Testes e2e

- [x] 4.1 Documentar o formato de título `/<rota> (MÉTODO) - <status> | <descrição>` em pt-br e verificar um exemplo real em `test/diocese.e2e-spec.ts`
- [x] 4.2 Documentar a cobertura mínima por controller (401, 403, 404, 400, 200/201) e a verificação de corpo (`message`, `error`, `statusCode`) e conferir contra `openspec/specs/testes-e2e/spec.md`
- [x] 4.3 Documentar o setup padronizado (`setupTestModule` em `test/test-setup.ts`, login `admin@admin.com`/`admin`, constante `principal`, `beforeAll`/`afterAll` com `app.close()`, `faker` em `pt_BR`) e os comandos (`npm run test:e2e`) e verificar que o texto bate com o código

## 5. Revisão e consistência

- [x] 5.1 Conferir que `CLAUDE.md` não contradiz `AGENTS.md` e referencia fontes canônicas (Swagger em `/api`, specs `testes-e2e` e `contexto-usuario`) e verificar lendo ambos os arquivos
- [x] 5.2 Revisar o `CLAUDE.md` completo: seções na ordem do design, markdown válido e sem duplicação de conteúdo; verificar abrindo o arquivo e conferindo os cabeçalhos
