# Tasks

## 1. Schema e migration

- [x] 1.1 Em `prisma/schema.prisma`, adicionar `usuarioRegioes usuarioRegiao[]` em `user` e em `regiao`, criar o model `usuarioRegiao` (`userId`, `regiaoId`, `@@unique([userId, regiaoId])`, `onDelete: Cascade` nos dois lados, sem auditoria) e remover o model `usuarioSetor` e as relações `usuarioSetores`; verificar com `npx prisma validate`
- [x] 1.2 Criar migration versionada que executa, nesta ordem: `CREATE TABLE "usuarioRegiao"`, `INSERT ... SELECT DISTINCT us."userId", s."regiaoId" FROM "usuarioSetor" us JOIN "setor" s ON s."id" = us."setorId" ON CONFLICT DO NOTHING`, `DROP TABLE "usuarioSetor"`; verificar com `npx prisma migrate dev --name create_table_usuario_regiao` e conferir no banco que cada usuário com setor passou a ter a região do setor
- [x] 1.3 Atualizar `prisma/seed.ts` para vincular `secretaria-cnc@admin.com` via `usuarioRegiao` à região de `primeiraParoquia.setor.regiaoId`; verificar com `npm run seed` que o seed conclui e que o usuário tem uma região

## 2. Gestão de regiões em /users

- [x] 2.1 Criar `src/users/dto/adicionar-regioes-ao-usuario.dto.ts` com `regiaoIds` (`@IsArray`, `@ArrayUnique`, `@IsInt({ each: true })`, `@IsPositive({ each: true })`); verificar com `npm run build`
- [x] 2.2 Renomear `UsersService.adicionarSetoresAoUsuario` para `adicionarRegioesAoUsuario(userId, regiaoIds)`, validar a existência das regiões em `tx.regiao.findMany` e responder 404 com os ids faltantes; atualizar `src/users/users.service.spec.ts` cobrindo substituição, lista vazia, usuário inexistente, região inexistente e falta de permissão; verificar com `npm test -- src/users`
- [x] 2.3 Substituir `PATCH /users/:id/setores` por `PATCH /users/:id/regioes` em `src/users/users.controller.ts`, atualizando as anotações Swagger; atualizar `test/users/user.e2e-spec.ts` para a nova rota e payload; verificar com `npm run test:e2e -- test/users`
- [x] 2.4 Incluir `usuarioRegioes { regiao }` em `UsersService.findOne` e serializar `regioes` (sempre lista) em `src/users/user.serializer.ts`, mantendo `paroquias`; cobrir com unidade ou e2e que usuário com região retorna `regioes` preenchido e usuário sem vínculo retorna lista vazia

## 3. Escopo CASL e serviços dependentes

- [x] 3.1 Em `src/casl/casl-ability/casl-ability.service.ts`, substituir `paroquiaDoSetor`/`escopoPorSetor` por `paroquiaDaRegiao`/`escopoPorRegiao` usando `setor.regiao.usuarioRegioes`, e apontar `SECRETARIA_CNC` para a nova estratégia; verificar com `npm test -- src/casl/casl-ability`
- [x] 3.2 Atualizar `src/casl/casl-ability/casl-ability.service.spec.ts` para cobrir leitura e escrita de comunidades, atualização de pessoa e leitura de paróquias recortadas pela região, além da negação de gestão de paróquia para `SECRETARIA_PAROQUIA`; verificar que a suíte passa
- [x] 3.3 Rodar `npm test` e corrigir os testes dos serviços que consomem a projeção (comunidade, pessoa, casal, contato, carisma) que ainda montem massa com `usuarioSetor`

## 4. Gestão de paróquias por região

- [x] 4.1 Em `src/paroquia/paroquia.service.ts`, trocar `validarSetorNoEscopoDoUsuario` por uma validação que verifica se o setor pertence a `usuarioRegiao` do usuário, distinguindo 404 de setor inexistente e 403 de setor fora das regiões, com mensagem citando "regiões"; verificar com `npm test -- src/paroquia`
- [x] 4.2 Atualizar `src/paroquia/paroquia.service.spec.ts` para substituir os mocks de `usuarioSetor` por `usuarioRegiao` (ou pela consulta de `setor` com `regiao.usuarioRegioes`) e cobrir create/update/remove dentro e fora da região; verificar que a suíte passa
- [x] 4.3 Atualizar o e2e de gestão de paróquia para `SECRETARIA_CNC` criar/editar/excluir na própria região, receber 403 em setor de outra região e `SECRETARIA_PAROQUIA` receber 403; verificar com `npm run test:e2e -- test/paroquia`

## 5. Escopo de região nos recursos de paróquia

- [x] 5.1 Renomear `test/secretaria-cnc-setor.e2e-spec.ts` para `test/secretaria-cnc-regiao.e2e-spec.ts` e montar duas regiões distintas (a do usuário e outra), cada uma com setor e paróquia próprios, ajustando as asserções de comunidades, pessoa, casal, contato e carismas
- [x] 5.2 Verificar o e2e renomeado com `npm run test:e2e -- test/secretaria-cnc-regiao`, garantindo que a paróquia "de fora" pertence a outra região e que o usuário recebe 403 nela

## 6. Documentação e integração

- [x] 6.1 Atualizar `AGENTS.md` para descrever `SECRETARIA_PAROQUIA` como escopo por paróquia e `SECRETARIA_CNC` como escopo por região (todas as paróquias dos setores das regiões), além de trocar `usuarioSetor` por `usuarioRegiao` na lista de exceções de auditoria
- [x] 6.2 Verificar a integração com `npm run build`, `npm test` e `npm run test:e2e` completos, conferindo que não restaram referências a `usuarioSetor`, `adicionarSetoresAoUsuario` ou `/users/:id/setores` no código, nos testes ou na documentação

## Workflow follow-up

- Arquivar a change após a revisão e o deploy coordenado com o frontend.
