# Proposal

## Why

O endpoint `DELETE /users/:id` já existe (`UsersService.remove` + controller), mas o contrato de resposta não foi definido: hoje `remove` devolve o registro cru, expondo o hash de senha e os tokens de recuperação no corpo da resposta — contrariando o princípio da spec `serializacao-usuario` de não expor dados sensíveis. Além disso, a suíte e2e de usuário não tem nenhum caso cobrindo exclusão, permissão ou cascata.

## What Changes

- Ajusta `UsersService.remove(id)` (em `src/users/users.service.ts`): mantém `this.validateDeleteAbility('user')` e a exclusão via `this.prismaService.user.delete({ where: { id } })`, mas **não retorna a linha crua** — o método não devolve corpo.
- Ajusta o `DELETE /users/:id` no controller para responder **`204 No Content` sem corpo**. Como o `PaginationInterceptor` é global (`APP_INTERCEPTOR`) e envolve toda resposta em `{ server, total, page, limit, data }`, a rota usa a resposta crua do Nest (`@Res()`) para produzir um 204 verdadeiramente vazio. **BREAKING**: antes a rota devolvia 200 com o registro cru; agora responde 204 sem corpo.
- Confirma o comportamento em cascata já existente no schema: ao excluir o usuário, os vínculos `usuarioParoquia` são removidos automaticamente (`onDelete: Cascade` já declarado em `usuarioParoquia.user`) — **sem alteração de schema nem migração**.
- A pessoa vinculada (`pessoaId`) **não** é excluída — decisão de domínio: `pessoa` é uma entidade rica e compartilhada (comunidades, equipes, carismas, endereços, casamentos).
- Adiciona testes e2e para `DELETE /users/:id` no `test/users/user.e2e-spec.ts`, seguindo o padrão `testes-e2e`.

## Capabilities

### New Capabilities
- `usuario`: Gestão de usuários (contas de acesso) — cobre a exclusão de um usuário por id, incluindo validação de permissão, resposta `204 No Content` sem corpo, remoção em cascata dos vínculos usuário–paróquia e preservação da pessoa vinculada.

### Modified Capabilities
<!-- Nenhuma capacidade existente tem requisitos alterados: a spec `serializacao-usuario` rege o detalhe (GET), não o DELETE; a spec `testes-e2e` já exige a cobertura de 401/403/404 e caminhos de sucesso que os novos casos seguirão. -->

## Impact

- `src/users/users.service.ts` — `remove` passa a não expor a linha crua (sem hash de senha no retorno).
- `src/users/users.controller.ts` — rota `DELETE /users/:id` responde `204` sem corpo (via `@Res()`).
- `test/users/user.e2e-spec.ts` — novos casos e2e para o DELETE.
- Sem alteração de schema Prisma nem novas migrações (cascade de `usuarioParoquia` já existente; `pessoa` preservada).
- **BREAKING (contrato de resposta):** cliente que dependia do corpo 200 da rota precisa migrar para o 204 sem corpo.

### Não faz parte deste escopo
- Exclusão da `pessoa` vinculada ou de qualquer dado além do usuário e seus vínculos `usuarioParoquia`.
- Soft delete / inativação em vez de exclusão física (`DELETE`).
- Bloqueios como "não permitir apagar o próprio usuário" ou "não apagar o último ADMIN" (podem ser um change futuro).