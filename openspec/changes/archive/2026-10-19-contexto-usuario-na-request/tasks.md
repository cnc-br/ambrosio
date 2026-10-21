# Tasks

## 1. Decorator e resolução do usuário

- [x] 1.1 Criar `src/auth/current-user.decorator.ts` com `@CurrentUser(property?)`, lendo `request.user` e devolvendo o campo indicado quando informado; verificar com `npm run build`
- [x] 1.2 Extrair de `src/auth/auth.guard.ts` a resolução do usuário (verify do token, busca no banco e `createForUser`) para um resolvedor compartilhado e refatorar o `AuthGuard` para usá-lo, mantendo 401 em qualquer falha; verificar com `npm run build` e `npx vitest run --config ./vitest.config.e2e.ts test/users test/pessoa` (após `npm run seed`)
- [x] 1.3 Criar o guard de autenticação opcional: sem cabeçalho `Authorization` retorna `true`; token presente porém inválido/expirado responde 401; token válido popula `request.user` e retorna `true`; adicionar teste unitário em `src/auth/` cobrindo os três casos e verificar que a suíte unitária passa (`npm test`)

## 2. Refatorar controllers protegidos

- [x] 2.1 Trocar o acesso manual a `req.user` em `UsersController.getMe` (`src/users/users.controller.ts`) por `@CurrentUser()`; verificar com `npm run build`
- [x] 2.2 Trocar o acesso manual a `req.user` em `AuthController.changePassword` (`src/auth/auth.controller.ts`) por `@CurrentUser('id')`; verificar com `npm run build`
- [x] 2.3 Adicionar caso e2e em `test/users/user.e2e-spec.ts` para `GET /users/me` retornando o usuário autenticado com `role`, no padrão de título `/<rota> (MÉTODO) - <status> | <descrição>`, e confirmar que a suíte passa (`npm run seed && npx vitest run --config ./vitest.config.e2e.ts test/users`)

## 3. Verificação final

- [x] 3.1 Rodar `npm run lint` e `npm run build` sem erros no estado final
- [x] 3.2 Rodar `npm run test:e2e` completo e confirmar que todas as suítes passam
- [x] 3.3 Validar o change com `openspec validate "contexto-usuario-na-request" --strict`
