# Tasks

## 1. Permissões CASL do mapa

- [x] 1.1 Adicionar `macroRegiao`, `regiao` e `setor` aos imports e ao `Subjects<{...}>` de `PermissionResource` em `src/casl/casl-ability/casl-ability.service.ts`; verificar com `npm run build`
- [x] 1.2 Conceder a `SECRETARIA_CNC` as regras `create`/`update` dos subjects `macroRegiao`, `regiao` e `setor`, mantendo `ADMIN` via `manage all` e nenhum outro papel com as capacidades; verificar com `npm test -- src/casl/casl-ability`
- [x] 1.3 Atualizar `src/casl/casl-ability/casl-ability.service.spec.ts` cobrindo autorização de `SECRETARIA_CNC` nos três subjects e negação para `SECRETARIA_PAROQUIA` e `NAO_IDENTIFICADO`; verificar que a suíte passa

## 2. Criação e atualização de macro-região

- [x] 2.1 Criar `src/mapa/macro-regiao/dto/create-macro-regiao.dto.ts` (`descricao` com `@IsString` e `@MaxLength(50)`; `ativo` opcional com `@IsBoolean`) e `update-macro-regiao.dto.ts` com `PartialType`; verificar com `npm run build`
- [x] 2.2 Fazer `MacroRegiaoService` estender `BaseService`, injetar `CaslAbilityService`, implementar `create(dto, userId?)` e `update(id, dto, userId?)` com `validateCreateAbility`/`validateUpdateAbility`, autoria de `cadastradoPorId`/`atualizadoPorId` e retorno do registro atualizado, e exportar `MacroRegiaoService` no `MacroRegiaoModule`; verificar com testes unitários de criação, atualização, 404 de id inexistente e autoria
- [x] 2.3 Adicionar `POST /macro-regiao` e `PATCH /macro-regiao/:id` ao controller com `@UseGuards(AuthGuard, RoleGuard)`, `@RequiredRoles(ADMIN, SECRETARIA_CNC)` e `@CurrentUser('id')`, mantendo os `GET` sem guarda; verificar com testes unitários dos metadados de papéis e com `npm run build`
- [x] 2.4 Atualizar os unitários de `macro-regiao.service.spec.ts` e `macro-regiao.controller.spec.ts` para a nova dependência `CaslAbilityService`; verificar com `npm test -- src/mapa/macro-regiao`
- [x] 2.5 Criar e2e de `POST/PATCH /macro-regiao` cobrindo 401 sem token, 403 com `SECRETARIA_PAROQUIA`, 201 com `ADMIN`, 201 com `SECRETARIA_CNC`, 200 na atualização, 400 de payload inválido, 404 de id inexistente e ausência de campos de auditoria na resposta, limpando os registros criados via `PrismaService` no `afterAll`; verificar com `npm run test:e2e -- test/mapa/macro-regiao`

## 3. Criação e atualização de região

- [x] 3.1 Criar `src/mapa/regiao/dto/create-regiao.dto.ts` (`descricao` com `@MaxLength(100)`, `macroRegiao: { id }` obrigatório, `ativo` opcional) e `update-regiao.dto.ts` com `PartialType`; verificar com `npm run build`
- [x] 3.2 Fazer `RegiaoService` estender `BaseService`, injetar `MacroRegiaoService` e implementar `create`/`update` validando a macro-região informada, preservando a atual quando o update não trouxer `macroRegiao`, gravando autoria e retornando o registro com `macroRegiao`; verificar com testes unitários de criação, atualização com e sem troca de macro-região, 404 de região/macro-região inexistente e autoria
- [x] 3.3 Importar `MacroRegiaoModule` em `RegiaoModule`, exportar `RegiaoService`, e adicionar `POST /regiao` e `PATCH /regiao/:id` ao controller com guardas e `@RequiredRoles(ADMIN, SECRETARIA_CNC)`, preservando os `GET` públicos; verificar com testes unitários dos metadados e com `npm run build`
- [x] 3.4 Atualizar os unitários de `regiao.service.spec.ts` e `regiao.controller.spec.ts` para as novas dependências; verificar com `npm test -- src/mapa/regiao`
- [x] 3.5 Criar e2e de `POST/PATCH /regiao` cobrindo 401, 403, 201 com `ADMIN` e `SECRETARIA_CNC`, 200, 400 de payload duplicado/inválido, 404 de macro-região inexistente, manutenção do vínculo quando `macroRegiao` é omitido e ausência de auditoria na resposta, limpando os registros no `afterAll`; verificar com `npm run test:e2e -- test/mapa/regiao`

## 4. Criação e atualização de setor

- [x] 4.1 Atualizar `src/mapa/setor/dto/create-setor.dto.ts` para exigir `regiao: { id }` e `ativo` opcional, e substituir `update-setor.dto.ts` por `PartialType(CreateSetorDto)`; verificar com `npm run build`
- [x] 4.2 Fazer `SetorService` estender `BaseService`, injetar `RegiaoService` e implementar `create`/`update` validando a região informada, preservando a atual quando o update não trouxer `regiao`, gravando autoria e retornando o registro com `regiao`; verificar com testes unitários de criação, atualização com e sem troca de região, 404 de setor/região inexistente e autoria
- [x] 4.3 Importar `RegiaoModule` em `SetorModule` e adicionar `POST /setor` e `PATCH /setor/:id` ao controller com guardas e `@RequiredRoles(ADMIN, SECRETARIA_CNC)`, preservando os `GET` públicos; verificar com testes unitários dos metadados e com `npm run build`
- [x] 4.4 Atualizar os unitários de `setor.service.spec.ts` e `setor.controller.spec.ts` para as novas dependências; verificar com `npm test -- src/mapa/setor`
- [x] 4.5 Criar e2e de `POST/PATCH /setor` cobrindo 401, 403, 201 com `ADMIN` e `SECRETARIA_CNC`, 200, 400 de payload duplicado/inválido, 404 de região inexistente, manutenção do vínculo quando `regiao` é omitida e ausência de auditoria na resposta, limpando os registros no `afterAll`; verificar com `npm run test:e2e -- test/mapa/setor`

## 5. Verificação integrada

- [x] 5.1 Executar `npm run lint`, `npm run build`, `npm test` e `npm run test:e2e`; verificar que todas as suítes passam, incluindo os e2e existentes de leitura pública em `test/mapa`
- [x] 5.2 Executar `openspec validate crud-mapa --strict`; verificar que o change está válido

## Workflow follow-up

- Sincronizar a capability `mapa` nas specs principais com `openspec sync specs` ou `openspec archive` após a implementação e a revisão.
- Arquivar o change e verificar que `openspec validate --strict` continua passando.
