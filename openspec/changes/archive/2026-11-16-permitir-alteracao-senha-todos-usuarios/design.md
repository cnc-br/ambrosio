# Design

## Context

Ver `proposal.md` — Why. O estado atual relevante:

- `AuthController.changePassword` já usa `@UseGuards(AuthGuard)` e `@CurrentUser('id')`, mas `AuthService.changePassword` grava via `UsersService.update`, que chama `validateUpdateAbility('user')`.
- `rolePermissionsMap` só concede `update` sobre `user` ao `ADMIN` (via `manage all`). Os demais papéis não têm essa regra, por isso recebem `403`.
- `BaseService.validateAbility` verifica a permissão apenas pelo tipo do recurso (`ability.can('update', 'user')`). Em CASL, uma regra condicional (`can('update', 'user', { id })`) já satisfaz essa checagem de tipo, independentemente do id — portanto conceder `update user` condicional abriria o `PATCH /users/:id` genérico.
- `forgotPassword` é público e também chama `UsersService.update`; sem `AuthGuard` a ability da request não é criada, e a chamada lança erro antes de gravar a senha temporária.
- O `UsersService.update` é o caminho administrativo: hasheia `password` quando presente e atualiza `role`, `active`, `email`, `whatsapp` e campos de reset.

## Goals / Non-Goals

**Goals:**

- Autorizar a troca da própria senha para todos os papéis sem ampliar a permissão administrativa `update user`.
- Separar a escrita de credencial da edição administrativa de usuário.
- Reaproveitar o mesmo caminho de escrita de senha no fluxo de recuperação, que não tem usuário autenticado.

**Non-Goals:**

- Não redesenhar o fluxo de recuperação (token, senha temporária, envio de email) além de fazer a escrita funcionar.
- Não invalidar tokens JWT existentes após a troca de senha.
- Não alterar a política de senha além do mínimo de 6 caracteres já validado.
- Não alterar o schema Prisma nem criar migration.

## Decisions

**1. Nova ação de permissão `changePassword` sobre o recurso `user`.**

- `PermActions` passa a incluir `'changePassword'`.
- Em `CaslAbilityService.createForUser`, conceder `can('changePassword', 'user')` para todo usuário resolvido, antes/aplicado junto das regras de papel. `ADMIN` continua coberto por `manage all`.
- Alternativa considerada: `can('update', 'user', { id: user.id })`. Rejeitada por dois motivos: (a) a checagem de tipo do `BaseService` ignoraria a condição e liberaria o `PATCH /users/:id`; (b) mesmo com checagem por subject, liberaria a edição de `role`, `active` e `email` do próprio usuário, o que está fora do escopo.
- Alternativa considerada: adicionar a regra em cada função de papel. Rejeitada por duplicação e risco de esquecer um papel novo; a concessão central garante "todos os usuários".

**2. Escrita de senha dedicada no `UsersService`.**

- Adicionar um método de troca da própria senha que: valida a ability `changePassword` sobre `user`, gera o hash com `bcrypt` (mesmo `SALT_OR_ROUNDS = 10`) e atualiza somente `password`, sem chamar `validateUpdateAbility('user')`.
- Adicionar um método separado para o fluxo de recuperação que grava `password` (temporária, hasheada), `resetPasswordToken` e `resetPasswordExpires` sem validação CASL, pois o fluxo é público e não possui usuário autenticado.
- Separar os dois métodos deixa explícito que o bypass de permissão existe apenas no caminho de recuperação, e não em uma API genérica de atualização.
- Alternativa considerada: manter `UsersService.update` e apenas adicionar a regra CASL. Rejeitada porque a edição administrativa continuaria no mesmo método sem controle de campos.

**3. `AuthService` orquestra a regra de negócio da troca.**

- `changePassword` continua: busca o usuário com senha, rejeita inativo, compara a senha atual com `bcrypt.compare` e, se válido, chama o método dedicado de troca. Mantém as mensagens atuais (`Senha atual incorreta.`, `Usuário não encontrado ou inativo.`, `Senha alterada com sucesso.`).
- `forgotPassword` passa a chamar o método dedicado de recuperação no lugar de `UsersService.update`, preservando token, expiração de 30 minutos e resposta genérica. Para que a resposta genérica também valha para email inexistente, `UsersService.findOneByEmail` passa a usar `findUnique` (retornando `null`) em vez de `findUniqueOrThrow`; o login já trata o retorno ausente.
- Alternativa considerada: mover a validação da senha atual para o `UsersService`. Rejeitada para manter o `AuthService` como dono do fluxo de autenticação e não transformar o serviço de usuários em serviço de credenciais.

**4. Controller mantém a identidade vinda do token.**

- `POST /auth/change-password` permanece com `@UseGuards(AuthGuard)` e `@CurrentUser('id')`; o DTO expõe apenas `currentPassword` e `newPassword`.
- Nenhum id de usuário é aceito no corpo, evitando que alguém troque a senha de terceiros.
- O `AuthGuard` já popula `request.user`; o decorator existente é reutilizado sem mudanças.

**5. Testes como contrato.**

- Unitário de `CaslAbilityService`: para cada valor de `UserRoleEnum`, `ability.can('changePassword', 'user')` é `true`; para não-`ADMIN`, `ability.can('update', 'user')` continua `false` (regressão de escalada de privilégio).
- Unitário de `AuthService`: troca usa o método dedicado; senha incorreta responde `401` sem escrita; recuperação usa o método de recuperação.
- Unitário de `UsersService`: método de troca valida a ability, hasheia e grava apenas `password`; método de recuperação grava senha e campos de reset sem CASL.
- e2e: usuário não-`ADMIN` troca a senha, faz login com a nova; senha atual errada retorna `401`; `PATCH /users/:id` por não-`ADMIN` continua `403`; `forgot-password` de usuário não-`ADMIN` conclui sem erro.

## Risks / Trade-offs

- [Risco] A ação `changePassword` é concedida a `NAO_IDENTIFICADO`, que hoje não lê `user`. → Mitigação: a ação só é usada pelo fluxo autenticado da própria senha; leitura de `user` continua negada.
- [Risco] `forgotPassword` redefine a senha sem exigir a senha atual. → Mitigação: comportamento pré-existente do fluxo de recuperação; a mudança apenas faz a escrita funcionar e mantém token de recuperação com expiração.
- [Risco] A senha temporária de recuperação continua sendo gerada de forma previsível. → Mitigação: fora de escopo; o `TODO` existente no código permanece e pode ser tratado em mudança própria.
- [Risco] Tokens emitidos antes da troca continuam válidos. → Mitigação: fora de escopo; a troca afeta apenas a autenticação futura.
- [Risco] Algum teste e2e de `PATCH /users/:id` assumir que papéis não-`ADMIN` conseguem atualizar o próprio registro. → Mitigação: a spec torna explícito que `PATCH /users/:id` permanece administrativo; ajustar expectativas se houver teste divergente.

## Migration Plan

- Sem migration de banco.
- Deploy único: a regra CASL, os métodos de senha e os chamadores entram juntos; não há período de compatibilidade necessário.
- Rollback: reverter o commit restaura a exigência de `update user` na troca de senha (voltando ao comportamento restrito ao `ADMIN`).
