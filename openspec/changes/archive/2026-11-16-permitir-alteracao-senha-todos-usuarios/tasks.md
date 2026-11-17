# Tasks

## 1. Permissão CASL de troca de senha

- [x] 1.1 Adicionar `'changePassword'` ao tipo `PermActions` e conceder `can('changePassword', 'user')` a todo usuário resolvido em `CaslAbilityService.createForUser`, mantendo `ADMIN` via `manage all`; verificar com `npm run test -- src/casl/casl-ability/casl-ability.service.spec.ts` que o serviço compila e os testes passam.
- [x] 1.2 Cobrir em `casl-ability.service.spec.ts` todos os valores de `UserRoleEnum` com `ability.can('changePassword', 'user') === true` e garantir que, para não-`ADMIN`, `ability.can('update', 'user') === false`; verificar com `npm run test -- src/casl/casl-ability/casl-ability.service.spec.ts`.

## 2. Escrita de senha no UsersService

- [x] 2.1 Adicionar em `UsersService` o método de troca da própria senha que valida `changePassword` sobre `user`, gera hash com `bcrypt` e atualiza somente `password`; verificar com `npm run test -- src/users/users.service.spec.ts` que o hash é aplicado e nenhum outro campo é enviado ao banco.
- [x] 2.2 Adicionar em `UsersService` o método dedicado ao fluxo de recuperação que grava senha temporária hasheada, `resetPasswordToken` e `resetPasswordExpires` sem validação CASL; verificar com testes unitários em `users.service.spec.ts` cobrindo os três campos e a ausência de checagem de ability.
- [x] 2.3 Confirmar que `UsersService.update` continua exigindo `update user` e segue hasheando `password` quando recebido; verificar com `npm run test -- src/users/users.service.spec.ts` que o caminho administrativo permanece inalterado.

## 3. Fluxos de autenticação

- [x] 3.1 Alterar `AuthService.changePassword` para usar o método dedicado após validar usuário ativo e senha atual, mantendo as mensagens e o `401` em senha incorreta; verificar com `npm run test -- src/auth/auth.service.spec.ts`.
- [x] 3.2 Alterar `AuthService.forgotPassword` para usar o método dedicado de recuperação, preservando token, expiração de 30 minutos e resposta genérica; verificar com `npm run test -- src/auth/auth.service.spec.ts` que `UsersService.update` não é mais chamado.
- [x] 3.3 Manter `POST /auth/change-password` com `@UseGuards(AuthGuard)` e identidade via `@CurrentUser('id')` em `auth.controller.ts`, sem aceitar id no DTO; verificar com `npm run build` que o controller compila e que o corpo aceito continua restrito a `currentPassword` e `newPassword`.

## 4. Testes e2e

- [x] 4.1 Criar `test/auth/alteracao-senha.e2e-spec.ts` cobrindo troca de senha por usuário não-`ADMIN`, login com a nova senha, senha atual incorreta retornando `401` e requisição sem token retornando `401`; verificar com `npm run test:e2e -- test/auth/alteracao-senha.e2e-spec.ts`.
- [x] 4.2 Cobrir no mesmo e2e `POST /auth/forgot-password` para usuário não-`ADMIN` sem erro e `PATCH /users/:id` por não-`ADMIN` retornando `403`; verificar com `npm run test:e2e -- test/auth/alteracao-senha.e2e-spec.ts`.

## 5. Integração

- [x] 5.1 Rodar `npm run build`, `npm run test` e `npm run test:e2e` e verificar que todos passam sem regressão nos fluxos administrativos de usuário.

## Workflow follow-up

- Arquivar a mudança após a revisão e a verificação do projeto.
