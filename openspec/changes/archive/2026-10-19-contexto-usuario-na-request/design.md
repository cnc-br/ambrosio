# Design

## Context

Ver `proposal.md` — Why. Pontos observados no código: `AuthGuard` (`src/auth/auth.guard.ts`) faz decode do exp, `jwtService.verify`, busca o `user` no banco por `payload.sub`, seta `request.user` e chama `abilityService.createForUser(user)`; lança 401 em qualquer falha. `RoleGuard` (`src/auth/role/role.guard.ts`) só barra quando há `@RequiredRoles` e exige `request.user`. Os guards são usados com `@UseGuards(AuthGuard, RoleGuard)` sem serem registrados como providers — funcionam porque `JwtModule`, `PrismaModule` e `CaslModule` são globais. `Express.Request.user` já é tipado como opcional em `src/@types/express/index.d.ts`.

## Goals / Non-Goals

**Goals:**
- Um único jeito de ler o usuário autenticado no handler, com `role` acessível.
- Comportamento de autenticação opcional isolado em um guard próprio, sem alterar rotas existentes.
- Não duplicar a lógica de verificação de token/usuário entre os guards.

**Non-Goals:**
- Tornar o guard global (APP_GUARD) ou introduzir `@Public()`.
- Aplicar autenticação opcional nos controllers hoje públicos — o guard fica disponível para adoção futura.
- Mudar quais rotas exigem autenticação ou permissão.

## Decisions

- **Decorator de parâmetro `@CurrentUser(property?)` em vez de serviço request-scoped.** Lê `request.user` (já populado pelo guard) e, se `property` for informado, devolve `req.user?.[property]`. Alternativa descartada: serviço injetável request-scoped — mais peso e não pedido; o decorator resolve o caso dos controllers.
- **Guard dedicado `OptionalAuthGuard` em vez de um modo no `AuthGuard`.** Mantém as responsabilidades separadas: `AuthGuard` continua 401 obrigatório; `OptionalAuthGuard` retorna `true` sem token. Alternativa descartada: flag `@OptionalAuth()` lida pelo `AuthGuard` — acopla dois comportamentos numa classe e complica o teste.
- **Resolvedor compartilhado `AuthUserResolver.resolve(request): Promise<user | null>`.** Extrai decode/verify/busca no banco/`createForUser` para um ponto único; `AuthGuard` lança 401 quando o resultado é nulo, `OptionalAuthGuard` só lança quando **havia** header Authorization e o token é inválido. Alternativa descartada: classe base abstrata — a composição é mais simples de testar.
- **Token presente e inválido em rota opcional → 401.** Não silenciar token ruim evita mascarar erros de cliente. Alternativa descartada: tratar como anônimo — esconderia expiração/erro de assinatura.
- **`@CurrentUser()` retorna `user | undefined`.** Coerente com o tipo atual de `request.user`; em rota protegida o guard garante presença.

## Risks / Trade-offs

- [`CaslAbilityService` é `Scope.REQUEST`; usar o resolvedor dentro do guard] → o guard continua sendo instanciado por request; validar com build e testes e2e existentes (`test/users`, `test/pessoa`).
- [Refatorar `getMe`/`changePassword` para `@CurrentUser()`] → manter a resposta de `GET /users/me` idêntica (retorna o usuário) para não quebrar consumidores.
- [Guard opcional sem aplicação neste change] → coberto por teste unitário do guard; adoção nos controllers públicos fica explicitamente fora de escopo.

## Open Questions

- Nenhuma pendente.
