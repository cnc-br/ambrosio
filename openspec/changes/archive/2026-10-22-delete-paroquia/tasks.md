# Tasks

## 1. Schema e migração

- [x] 1.1 Adicionar `onDelete: Cascade` na relação `comunidade.paroquia` (lado `comunidade`) em `prisma/schema.prisma` e verificar que a relação passou a declarar `onDelete: Cascade` (ex.: `grep -n "onDelete: Cascade" prisma/schema.prisma`)
- [x] 1.2 Gerar e aplicar a migração com `npx prisma migrate dev --name delete_paroquia_cascade_comunidades` e executar `npx prisma generate`; verificar que existe um novo diretório em `prisma/migrations/` e que o cliente gerado (`src/prisma/generated`) foi atualizado sem erros

## 2. Implementação do service

- [x] 2.1 Implementar `ParoquiaService.remove(id)`: chamar `this.validateDeleteAbility('paroquia')` e, dentro de `this.prisma.$transaction`, excluir a paróquia com `transaction.paroquia.delete({ where: { id }, select: PAROQUIA_SELECT })` e em seguida excluir o endereço com `transaction.endereco.delete({ where: { id: paroquia.endereco.id } })`, retornando `serializeParoquia(result)` (sem try/catch local, deixando o `P2025` subir para o `PrismaExceptionsFilter`); verificar com `npm run build` que o tipo compila e que `remove` deixa de ser o stub de string
- [x] 2.2 Verificar o comportamento de permissão: com um usuário autenticado sem permissão de `delete` sobre `paroquia`, `remove` lança `ForbiddenException`; confirmar via execução da suíte e2e do grupo 3 (cobrindo 401/403) ou teste unitário equivalente

## 3. Testes e2e

- [x] 3.1 Adicionar em `test/paroquia.e2e-spec.ts` o caso `DELETE /paroquia/:id` sem token → espera 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401 (título pt-br no padrão `testes-e2e`)
- [x] 3.2 Adicionar o caso `DELETE /paroquia/:id` com usuário autenticado sem permissão (`ronaldinho@admin.com`) → espera 403 com `message` `Você não tem permissão para delete paroquia`, `error` `Forbidden` e `statusCode` 403
- [x] 3.3 Adicionar o caso `DELETE /paroquia/:id` com id de paróquia inexistente → espera 404 com `message` `O registro de 'Paroquia' não foi encontrado.` e `statusCode` 404
- [x] 3.4 Adicionar o caso de sucesso: criar paróquia via `POST /paroquia`, anotando `data.endereco.id`, criar uma comunidade vinculada via `POST /comunidade` com o `paroquiaId` retornado, chamar `DELETE /paroquia/:id` → espera 200 e `data.id` igual ao id criado; em seguida `GET /comunidade/:id` da comunidade criada → espera 404 e `GET /endereco/:id` do endereço da paróquia → espera 404
- [x] 3.5 Executar a suíte e2e com `npm run test:e2e` e verificar que todos os casos de `test/paroquia.e2e-spec.ts` passam (incluindo os novos de DELETE e os já existentes)

## Workflow follow-up

- Após revisão do change, arquivar `delete-paroquia` com o fluxo de archive do OpenSpec.
- Verificar o resultado arquivado (spec `paroquia` promovida para `openspec/specs/paroquia/spec.md`).