# Proposal

## Why

Hoje o usuário autenticado só chega ao controller via `@Req() req` (ex.: `src/users/users.controller.ts:36`) ou `@Request() req` (ex.: `src/auth/auth.controller.ts:35`), e o `AuthGuard` (`src/auth/auth.guard.ts:61`) popula `request.user` com o registro do banco — incluindo `role`. Não existe uma forma padronizada de obter esses dados, e a `role`, que determina o comportamento por perfil, fica escondida atrás de acesso manual a `req.user`. Ao mesmo tempo, várias rotas não exigem permissão (`RoleGuard` passa quando não há `@RequiredRoles`), então o mecanismo precisa funcionar sem obrigar toda rota a ser protegida.

## What Changes

- Adicionar o decorator de parâmetro `@CurrentUser()` para obter o usuário autenticado no handler, com opção de extrair um campo (ex.: `@CurrentUser('role')`).
- Introduzir um guard de **autenticação opcional**: identifica o usuário quando há token válido e não bloqueia a request quando não há token (rotas sem exigência de autenticação).
- Extrair a resolução do usuário a partir do token (verify + busca no banco + criação da ability) para um ponto único reutilizado por `AuthGuard` e pelo guard opcional, evitando divergência de comportamento.
- Refatorar os controllers protegidos para consumir `@CurrentUser()` onde hoje usariam `req.user`: `users.controller.ts` (`getMe`) e `auth.controller.ts` (`changePassword`).
- Preservar o comportamento atual de proteção: 401 sem token, 403 sem permissão (`@RequiredRoles`).

## Capabilities

### New Capabilities
- `contexto-usuario`: Disponibilização do usuário autenticado (e de campos como `role`) ao controller por meio de decorator, e identificação opcional do usuário em rotas que não exigem autenticação, sem bloquear a request na ausência de token.

### Modified Capabilities
<!-- Nenhuma: a spec existente `testes-e2e` não muda; não há spec cobrindo auth/guards hoje. -->

## Impact

- **Código**: `src/auth/` (novo decorator `current-user.decorator.ts`, guard de autenticação opcional, extração do resolvedor de usuário em `auth.guard.ts`), `src/users/users.controller.ts`, `src/auth/auth.controller.ts`.
- **Configuração**: nenhuma env var nova; `CaslModule`/`PrismaModule`/`JwtModule` já são globais.
- **API**: sem mudança de contrato; `GET /users/me` continua retornando o usuário, agora tipado pelo decorator.
- **Fora de escopo**: aplicar o guard opcional nos controllers hoje públicos (configurações, mapa, endereço, etc.) — fica disponível para adoção futura.
