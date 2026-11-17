# Proposal

## Why

Hoje `POST /auth/change-password` só funciona para `ADMIN`. O `AuthService.changePassword` delega a escrita para `UsersService.update`, que chama `validateUpdateAbility('user')`; como apenas `ADMIN` possui `update` sobre `user`, todos os demais perfis recebem `403` — inclusive `SECRETARIA_CNC`, catequistas e `NAO_IDENTIFICADO`. A troca de senha é uma operação do próprio usuário sobre a própria credencial e não deveria depender de uma permissão administrativa. O mesmo caminho genérico é usado pelo `POST /auth/forgot-password`, que roda sem usuário autenticado e também falha ao tentar gravar a senha temporária.

## What Changes

- **Permissão dedicada**: introduzir a ação de permissão `changePassword` sobre o recurso `user` em `src/casl/casl-ability/casl-ability.service.ts`, concedida a **todos** os perfis (`ADMIN` continua coberto por `manage all`). A permissão autoriza apenas a troca da própria senha; não concede `update` genérico sobre `user`.
- **Escrita de senha separada da edição administrativa**: criar um caminho dedicado em `UsersService` para definir a senha (hash + atualização apenas do campo `password`), sem passar por `validateUpdateAbility('user')`. O `PATCH /users/:id` continua exigindo a permissão administrativa `update user`, preservando o controle atual.
- **Troca autenticada**: `AuthService.changePassword` usa o novo caminho, mantendo a validação da senha atual e do usuário ativo. `POST /auth/change-password` permanece protegido por `AuthGuard` e obtém a identidade do usuário autenticado via `@CurrentUser('id')` em `src/auth/auth.controller.ts`, sem aceitar id no corpo da requisição.
- **Recuperação de senha**: `POST /auth/forgot-password` passa a gravar a senha temporária e os dados de reset pelo mesmo caminho dedicado, funcionando sem contexto CASL e sem expor uma permissão pública de `update user`. O token de recuperação e a expiração de 30 minutos são preservados.
- **Sem escalada de privilégio**: um usuário comum que troca a própria senha não passa a poder alterar `role`, `active`, `email`, `whatsapp` ou a senha de terceiros via `PATCH /users/:id`.
- **Compatibilidade**: o contrato de `POST /auth/change-password` permanece `201` com `{ message: 'Senha alterada com sucesso.' }`; senha atual incorreta continua `401`, e ausência de token continua `401`.

## Capabilities

### New Capabilities

- `alteracao-senha`: gestão da própria credencial pelo usuário autenticado — troca de senha com confirmação da senha atual — e definição de senha no fluxo público de recuperação, para todos os perfis de usuário.

### Modified Capabilities

<!-- Nenhuma: `serializacao-usuario` já cobre a validação da senha atual sem expor o hash, e `usuario` trata da exclusão administrativa; o contrato de ambas não muda. -->

## Impact

- **Código**: `src/casl/casl-ability/casl-ability.service.ts` (ação `changePassword` e concessão por perfil), `src/users/users.service.ts` (método dedicado de definição de senha), `src/auth/auth.service.ts` (troca e recuperação usando o método dedicado), `src/auth/auth.controller.ts` (identidade via `@CurrentUser('id')`).
- **API**: `POST /auth/change-password` passa a funcionar para todos os perfis autenticados; `POST /auth/forgot-password` passa a concluir a definição da senha temporária; `PATCH /users/:id` mantém a exigência de permissão administrativa.
- **Banco**: sem alteração de schema; continua usando `user.password`, `user.resetPasswordToken` e `user.resetPasswordExpires`.
- **Dependências**: nenhuma nova; `bcrypt` e `@casl/ability` já são usados.
- **Testes**: unitários de `CaslAbilityService`, `AuthService` e `UsersService`; e2e de troca de senha por perfil não-`ADMIN` e de recuperação de senha.
