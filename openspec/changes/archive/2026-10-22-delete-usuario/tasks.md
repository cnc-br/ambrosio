# Tasks

## 1. Implementação do service e controller

- [x] 1.1 Ajustar `UsersService.remove(id)` para executar `this.validateDeleteAbility('user')`, excluir com `await this.prismaService.user.delete({ where: { id } })` e **não retornar a linha crua** (sem `return` do resultado); verificar com `npm run build` que o tipo compila
- [x] 1.2 Ajustar o `@Delete(':id')` em `src/users/users.controller.ts` para responder `204` sem corpo: `async remove(@Param('id') id: string, @Res() res: Response)`, chamando `this.usersService.remove(id)` seguido de `res.status(HttpStatus.NO_CONTENT).end()`; verificar com `npm run build` que a rota compila (importar `@Res()` do `@nestjs/common` e `Response` do `express`)
- [x] 1.3 Verificar o comportamento de permissão: com um usuário autenticado sem permissão de `delete` sobre `user`, `remove` lança `ForbiddenException`; confirmar via execução da suíte e2e do grupo 2 (cobrindo 401/403) ou teste unitário equivalente

## 2. Testes e2e

- [x] 2.1 Adicionar em `test/users/user.e2e-spec.ts` o caso `DELETE /users/:id` sem token → espera 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401 (título pt-br no padrão `testes-e2e`)
- [x] 2.2 Adicionar o caso `DELETE /users/:id` com usuário autenticado sem permissão (`ronaldinho@admin.com`) → espera 403 com `message` `Você não tem permissão para delete user`, `error` `Forbidden` e `statusCode` 403
- [x] 2.3 Adicionar o caso `DELETE /users/:id` com id de usuário inexistente → espera 404 com `message` `O registro de 'Usuário' não foi encontrado.` e `statusCode` 404
- [x] 2.4 Adicionar o caso de sucesso: criar um usuário dedicado via `POST /users` (e-mail/CPF próprios, fixture da suíte), vincular paróquias via `PATCH /users/:id/paroquias`, chamar `DELETE /users/:id` → espera 204 com corpo vazio (`expect(res.body).toEqual({})`); em seguida `GET /users/:id` → espera 404 e consultar `PrismaService.usuarioParoquia` confirmando que os vínculos do usuário foram removidos
- [x] 2.5 Executar a suíte e2e com `npm run test:e2e` e verificar que todos os casos de `test/users/user.e2e-spec.ts` passam (incluindo os novos de DELETE e os já existentes)

## Workflow follow-up

- Após revisão do change, arquivar `delete-usuario` com o fluxo de archive do OpenSpec.
- Verificar o resultado arquivado (spec `usuario` promovida para `openspec/specs/usuario/spec.md`).