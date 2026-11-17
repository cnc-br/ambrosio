# Tasks

## 1. Vínculo usuário–setor

- [x] 1.1 Adicionar o modelo `usuarioSetor` em `prisma/schema.prisma` (`userId`, `setorId`, `@@unique([userId, setorId])`, `onDelete: Cascade`) e gerar a migration versionada com a tabela, a unicidade e os cascades; verificar com `npx prisma validate` e `npx prisma migrate dev`
- [x] 1.2 Incluir na migration a conversão dos usuários existentes: `UPDATE "user" SET role = 'SECRETARIA_PAROQUIA' WHERE role = 'SECRETARIA_CNC';`; verificar com `npx prisma migrate reset` seguido de `npm run seed` que nenhum usuário permanece como `SECRETARIA_CNC` por engano
- [x] 1.3 Criar `src/users/dto/adicionar-setores-ao-usuario.dto.ts` com `setorIds` (`@IsArray`, `@ArrayUnique`, `@IsInt({ each: true })`, `@IsPositive({ each: true })`); verificar com `npm run build`
- [x] 1.4 Implementar `UsersService.adicionarSetoresAoUsuario(userId, setorIds)` transacional (valida usuário, apaga vínculos anteriores e cria os informados) e a rota `PATCH /users/:id/setores` em `src/users/users.controller.ts`; verificar com teste unitário do serviço cobrindo substituição, lista vazia, usuário inexistente e setor inexistente
- [x] 1.5 Adicionar e2e de `PATCH /users/:id/setores` cobrindo 200 com substituição, 404 de usuário, 400 de payload inválido e 403 de perfil sem permissão; verificar com `npm run test:e2e -- test/users`

## 2. Refatoração declarativa das permissões

- [x] 2.1 Criar os tipos `PermissionRule` e `EscopoSecretaria`, a projeção única de condição de paróquia (`usuarioParoquias` ou `setor.usuarioSetores`), as fábricas `escopoPorParoquia` e `escopoPorSetor` e o bundle `permissoesSecretaria(escopo)`; verificar com `npm run build`
- [x] 2.2 Reescrever `rolePermissionsMap` para compor o bundle: `SECRETARIA_PAROQUIA` usa `escopoPorParoquia`; `SECRETARIA_CNC` usa `escopoPorSetor` mais `create`/`update`/`delete` de `paroquia`; manter `ADMIN` irrestrito e os demais papéis sem ganho de capacidade; verificar com `npm test -- src/casl/casl-ability`
- [x] 2.3 Atualizar `src/casl/casl-ability/casl-ability.service.spec.ts` para cobrir escopo por paróquia do `SECRETARIA_PAROQUIA`, escopo por setor do `SECRETARIA_CNC`, gestão de paróquia exclusiva do `SECRETARIA_CNC` e negação de gestão para `SECRETARIA_PAROQUIA`; verificar que a suíte passa

## 3. Migração do comportamento local para SECRETARIA_PAROQUIA

- [x] 3.1 Atualizar os testes unitários de `pessoa`, `casal`, `contato`, `carisma` e `comunidade` que usam `SECRETARIA_CNC` como secretaria local para `SECRETARIA_PAROQUIA`; verificar com `npm test`
- [x] 3.2 Atualizar os e2e de `pessoa`, `comunidade`, `carisma` e `auth` que provisionam `SECRETARIA_CNC` como secretaria local para `SECRETARIA_PAROQUIA`; verificar com `npm run test:e2e` nas suítes afetadas
- [x] 3.3 Confirmar que `GET /pessoa` e `GET /pessoa/:id` continuam irrestritos para `SECRETARIA_PAROQUIA` e que a escrita escopada (pessoa, contato, casal, carisma, comunidade, etapa) continua respondendo 403 fora do escopo; verificar pelos e2e existentes atualizados

## 4. Gestão de paróquia pelo SECRETARIA_CNC

- [x] 4.1 Em `ParoquiaService.create`, validar que o `setor.id` informado pertence aos setores do `SECRETARIA_CNC` (403 fora do escopo), mantendo `ADMIN` irrestrito; verificar com teste unitário de `paroquia.service.spec.ts`
- [x] 4.2 Em `ParoquiaService.update`, validar o setor de destino quando o payload trouxer `setor`; em `ParoquiaService.remove`, buscar a paróquia pelo escopo de leitura antes de excluir; verificar com testes unitários de update/remove fora do escopo
- [x] 4.3 Criar e2e de gestão de paróquia cobrindo `SECRETARIA_CNC` criando/editando/excluindo no próprio setor, 403 em setor alheio, 404 de paróquia inexistente, `SECRETARIA_PAROQUIA` sem permissão e `ADMIN` irrestrito; verificar com `npm run test:e2e -- test/paroquia`

## 5. Escopo por setor nos recursos de paróquia

- [x] 5.1 Ajustar os serviços que montam condição de paróquia (`comunidade`, `etapa`, `pessoa`, `casal`, `contato`, `carisma`) para consumir a nova projeção e funcionar com `usuarioSetor`; verificar com `npm test`
- [x] 5.2 Adicionar e2e de escopo por setor para `SECRETARIA_CNC` em comunidades, atualização de pessoa, casal, contato e carismas, cobrindo dentro e fora do setor; verificar com `npm run test:e2e`

## 6. Seed e documentação

- [x] 6.1 Atualizar `prisma/seed.ts`: `secretaria@admin.com` passa a `SECRETARIA_PAROQUIA` vinculado à paróquia 1 e criar `secretaria-cnc@admin.com` como `SECRETARIA_CNC` vinculado ao setor da paróquia 1; verificar com `npm run seed`
- [x] 6.2 Atualizar `AGENTS.md` para descrever `SECRETARIA_PAROQUIA` como secretaria local e `SECRETARIA_CNC` como secretaria por setor com gestão de paróquia; verificar que não resta descrição antiga do `SECRETARIA_CNC` como perfil local
- [x] 6.3 Revisar a documentação de domínio e os demais docs que citam papéis (por exemplo `docs/agents/`) para refletir os dois perfis; verificar com `grep` que não há referência obsoleta

## 7. Verificação integrada

- [x] 7.1 Executar `npm run lint`, `npm run build`, `npm test` e `npm run test:e2e`; verificar que todas as suítes passam
- [x] 7.2 Executar `openspec validate reorganizar-permissoes-e-roles --strict`; verificar que o change está válido

## Workflow follow-up

- Aplicar os deltas nas specs principais via `openspec sync specs` ou `openspec archive` após a implementação e a revisão.
- Arquivar o change e verificar que as specs principais passam em `openspec validate --strict`.
