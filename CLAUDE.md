# CLAUDE.md — Santo Ambrósio (Backend CNC)

Guia de contexto para agentes e desenvolvedores trabalharem nesta API. Escrito em pt-br, seguindo as convenções do repositório. Se este arquivo e o `AGENTS.md` divergirem, `AGENTS.md` trata de skills/processos de agente; este trata de arquitetura da API e testes.

## Visão geral

Backend (API REST) da plataforma CNC — Santo Ambrósio, servindo o dashboard de https://apicncbrasil.cn.org.br.

- **Stack**: NestJS (TypeScript, ESM), Prisma + PostgreSQL, JWT, CASL (autorização), Swagger, pino/ELK (logging), Vitest + Supertest (e2e).
- **Porta**: `3005` (`src/main.ts`).
- **Swagger**: disponível em `http://localhost:3005/api`.
- **Dependência externa**: a API de pessoas (São Pedro) é externa; para cadastrar pessoas rode `bash ./scripts/start.sh` (ver README).

## Arquitetura e módulos

App NestJS em `src/`, módulos por domínio (um controller RESTful por recurso):

- `auth` — login JWT, guards, decorators (`current-user.decorator.ts`, `required-roles.decorator.ts`).
- `users` — usuários do sistema.
- `pessoa` — pessoas (com integração externa São Pedro).
- `diocese`, `paroquia`, `localidade`, `endereco` — estrutura eclesiástica/territorial.
- `mapa` — `setor`, `regiao`, `macro-regiao`.
- `configuracoes` — `estado-civil`, `escolaridade`, `situacao-religiosa`, `pais`, `cidade`, `tipo-diocese`, `tipo-localidade`, etc.
- `comunidade`, `equipe`, `carisma` — vida comunitária.
- `external` — integrações externas (`sao-pedro`, `send-email`).
- `casl` — capacidade/regras de autorização.
- `commons` — `base.service`, interceptors, filters, enums, utils.
- `health` — healthchecks (terminus).

Convenção: controllers em `src/<modulo>/<modulo>.controller.ts` com `@Controller('<recurso>')`, serviços em `*.service.ts` e DTOs em `dto/`. A lista exata de endpoints está no Swagger (`/api`).

## Autenticação e autorização

- **Login**: `POST /auth/login` com `{ email, password }` → retorna `{ access_token, access_token_type: 'Bearer' }`. O interceptor global de paginação envolve a resposta em `data`, então no cliente o token está em `res.data.access_token`.
- **Token JWT** (HS256): payload com `sub` (id do usuário), `email`, `role` e `permissions` (regras CASL).
- **Guards** (em `src/auth/`):
  - `AuthGuard` — exige token Bearer válido; sem token → **401** com `message` `Invalid or missing token`.
  - `OptionalAuthGuard` — resolve o usuário quando há token válido, mas permite request sem token; token **presente porém inválido/expirado** → **401** com `Invalid token`.
  - `RoleGuard` — checa `@RequiredRoles(...)`; usuário autenticado sem a permissão exigida → **403** (`Forbidden`).
- **Decorators**:
  - `@CurrentUser(prop?)` — injeta o usuário autenticado da request (ou um campo dele, ex.: `@CurrentUser('id')`).
  - `@RequiredRoles(...roles)` — declara papéis exigidos numa rota.
- **Usuário opcional**: rotas sem exigência de autenticação podem usar `OptionalAuthGuard`; o decorator de usuário resulta em valor ausente quando não há token. Ver spec `openspec/specs/contexto-usuario/spec.md`.

## Convenções transversais

- **Validação**: `ValidationPipe` global (`src/main.ts`) valida DTOs — payload inválido → **400** (`Bad Request`).
- **Erros de Prisma**: `PrismaExceptionsFilter` traduz erros conhecidos para mensagens pt-br (ex.: duplicidade, registro não encontrado → **404**).
- **Paginação**: `PaginationInterceptor` (global) envolve respostas em `{ server, total, page, limit, data }` (default `page=1`, `limit=50`).
- **Logging**: `LoggingInterceptor` + pino, com `requestId` rastreável por request; modo ELK grava logs JSON em arquivo (`ELK_ENABLED=true`, ver README).
- **Swagger**: anotações `@ApiTags`/`@ApiResponse` nos controllers, montado em `/api`.

## Testes e2e

Fonte de verdade: spec `openspec/specs/testes-e2e/spec.md`. Exemplo canônico: `test/diocese.e2e-spec.ts`.

- **Formato do título** (pt-br): `` `/${principal} (MÉTODO) - <status> | <descrição>` ``, ex.: `` `/diocese (GET) - 401 | nao pode ver diocese se nao tiver autenticado` ``.
- **Cobertura mínima por controller** (quando aplicável): sem autenticação → 401; autenticado sem permissão → 403; recurso não encontrado → 404; payload inválido → 400; leitura → 200; criação → 201; atualização → 200.
- **Verificação de corpo**: para erros conferir `res.body.message`, `res.body.error` (quando aplicável) e `res.body.statusCode`; para sucesso, os campos obrigatórios do corpo.
- **Setup padrão**: `setupTestModule()` de `test/test-setup.ts` (sobe o `AppModule` real com `ValidationPipe` e `PrismaExceptionsFilter`, sem mocks de banco), login `admin@admin.com` / `admin` no `beforeAll` para obter o token, constante `principal` com o nome base da rota, `afterAll` com `app.close()`.
- **Dados descartáveis**: `faker` em `pt_BR` (`@faker-js/faker/locale/pt_BR`).
- **Execução**: `npm run test:e2e` (faz seed do banco e roda Vitest com `vitest.config.e2e.ts`).

## Comandos

```bash
npm run start:dev      # sobe a API em modo watch (porta 3005)
npm run test           # testes unitários (Vitest)
npm run test:e2e       # seed + testes e2e
npm run test:cov       # cobertura
npm run lint           # ESLint
npm run format         # Prettier
npm run generate       # prisma generate
npm run seed           # reset + seed do banco
npm run migrate        # prisma migrate dev
```
