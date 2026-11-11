# Tasks

## 1. Schema Prisma e migration

- [x] 1.1 Atualizar `prisma/schema.prisma`: adicionar `cadastradoPorId String?` e `atualizadoPorId String?` em `pessoa`, as relações nomeadas `cadastradoPor`/`atualizadoPor` com `onDelete: SetNull` e as relações reversas `pessoasCadastradas`/`pessoasAtualizadas` em `user`, sem alterar `createdAt`/`updatedAt`. Verificar com `npx prisma validate` e `npx prisma generate`.
- [x] 1.2 Criar a migration versionada (`npx prisma migrate dev --name alter_table_pessoa_add_autoria`) e conferir no SQL gerado que apenas as duas colunas de autoria e as FKs `ON DELETE SET NULL` foram adicionadas, sem alterar nenhuma coluna existente.

## 2. Persistência da autoria no `PessoaService`

- [x] 2.1 Alterar a assinatura de `create` para `create(dto, userId, comunidadeId?)` e incluir `cadastradoPorId: userId` e `atualizadoPorId: userId` no `prisma.pessoa.create`; adicionar testes unitários em `src/pessoa/pessoa.service.spec.ts` verificando os valores persistidos e que a criação de comunidade continua funcionando.
- [x] 2.2 Alterar a assinatura de `update` para `update(id, dto, userId)`, manter o fluxo atual da situação religiosa e gravar `atualizadoPorId: userId` somente após o sucesso de `updateExternalPessoa`; adicionar testes unitários cobrindo autoria gravada em sucesso e ausência de gravação de autoria em falha da API externa.

## 3. Identidade do usuário no controller

- [x] 3.1 Injetar `@CurrentUser('id') userId: string` em `PessoaController.create` e `PessoaController.update` e repassar ao service nas novas posições de argumento; atualizar `src/pessoa/pessoa.controller.spec.ts` para verificar a delegação com o id do usuário autenticado e que o payload não é usado como fonte de autoria.

## 4. Garantia de não exposição nas respostas

- [x] 4.1 Estender `src/pessoa/pessoa.serializer.spec.ts` para verificar que `cadastradoPorId` e `atualizadoPorId` não aparecem no objeto serializado, mesmo quando presentes no registro de entrada.

## 5. Testes e2e

- [x] 5.1 Estender `test/pessoa/pessoa-create.e2e-spec.ts` para: após `POST /pessoa`, consultar o banco e verificar `cadastradoPorId`/`atualizadoPorId` iguais ao usuário autenticado e a ausência desses campos no corpo da resposta; após `PATCH /pessoa/:id`, verificar que `atualizadoPorId` passa a ser o usuário editor.

## 6. Verificação final

- [ ] 6.1 Rodar `npm run test` e `npm run test:e2e` completos, confirmando que as suítes de pessoa passam e que o schema/migration não alteraram nenhum campo existente.

## Workflow follow-up

- Arquivar o change após revisão (`/opsx-archive`) e verificar o resultado arquivado.
