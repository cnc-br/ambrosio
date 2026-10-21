# Proposal

## Why

O repositório não possui um documento único que oriente agentes de IA (e novos desenvolvedores) sobre o desenho da API backend e as convenções de teste e2e já estabelecidas. O `AGENTS.md` atual é apenas um índice de skills; faltam a visão geral da arquitetura (stack, módulos, autenticação, convenções) e as regras de escrita de testes e2e definidas na spec `testes-e2e`. Sem essa referência, agentes e revisores geram código e testes que divergem do padrão já acordado.

## What Changes

- Criar um novo arquivo `CLAUDE.md` na raiz do repositório (lido pelo opencode e por agentes baseados em Claude).
- O documento apresenta a **proposta da API backend**:
  - Stack: NestJS (TypeScript), Prisma, Swagger, JWT.
  - Arquitetura: módulos (`auth`, `pessoa`, `diocese`, `paroquia`, `mapa`, `configuracoes`, `comunidade`, `equipe`, `carisma`, `users`, `external/sao-pedro`, `health`), bootstrapping e porta (3005).
  - Autenticação/autorização: login `POST /auth/login`, guards (`AuthGuard`, `OptionalAuthGuard`, `RoleGuard`), decorators (`@CurrentUser`, `@RequiredRoles`) e usuário opcional em rotas sem exigência de autenticação.
  - Convenções transversais: `ValidationPipe` global, `PrismaExceptionsFilter`, paginação, logging com `requestId` (pino/ELK) e Swagger em `/api`.
- O documento apresenta as **convenções de teste e2e** conforme a spec `testes-e2e`:
  - Formato de título `/<rota> (MÉTODO) - <status> | <descrição>`, em pt-br.
  - Cobertura mínima por controller: 401 (sem autenticação), 403 (sem permissão), 404 (não encontrado), 400 (validação), 200/201 (caminhos de sucesso).
  - Verificação de corpo de erro: `message`, `error` (quando aplicável) e `statusCode`.
  - Setup padronizado: `setupTestModule` (`test/test-setup.ts`), login `admin@admin.com`/`admin`, constante `principal`, `beforeAll`/`afterAll` com `app.close()` e `faker` em `pt_BR`.
- Mudança exclusivamente documental: nenhum comportamento de sistema muda.

## Capabilities

Mudança puramente documental — o change declara `skip_specs: true` no `.openspec.yaml`, pois não há mudança de comportamento especificado (apenas documentação). Nenhuma capability é criada ou modificada; não se deve inventar requisito para satisfazer validação.

### New Capabilities
_(nenhuma — `skip_specs: true`)_

### Modified Capabilities
_(nenhuma)_

## Impact

- **Documentação**: novo arquivo `CLAUDE.md` na raiz do repositório; `AGENTS.md` permanece inalterado.
- **Código/API**: nenhuma alteração em `src/`, `test/` ou infraestrutura.
- **Dependências**: nenhuma.
- **Ferramentas**: nenhuma.
