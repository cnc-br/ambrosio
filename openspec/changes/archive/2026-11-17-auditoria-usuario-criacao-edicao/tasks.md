# Tasks

## 1. Schema e migration

- [x] 1.1 Adicionar em `prisma/schema.prisma` os campos `cadastradoPorId`/`atualizadoPorId` (String?, `onDelete: SetNull`), as relações `cadastradoPor`/`atualizadoPor` (nomes únicos `<Model>CadastradoPor`/`<Model>AtualizadaPor`), os índices `@@index([cadastradoPorId])`/`@@index([atualizadoPorId])` e, onde faltarem, `createdAt`/`updatedAt` nos 29 models-alvo (todos exceto `pessoa` — pronto —, `user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution` e o enum `ScheduledJobStatus`); adicionar as relações de retorno no model `user`; verificar com `npx prisma validate`
- [x] 1.2 Gerar a migration versionada `add_auditoria_criacao_edicao` com `npx prisma migrate dev` e confirmar que as colunas são nullable/default (sem quebra de dados existentes); verificar com `npm run seed` que o seed continua passando
- [x] 1.3 Conferir a cobertura: enumerar os models do schema e comparar com a lista-alvo (nenhuma tabela fora da lista de exclusão sem os 4 campos); verificar com `grep -L "cadastradoPorId" prisma/schema.prisma` + revisão manual

## 2. Wiring — carisma e pessoaCarisma

- [x] 2.1 Em `CarismaController`, injetar `@CurrentUser('id')` em `POST /carismas`, `POST /carismas/pessoa/:pessoaId` e `PATCH /carismas/:id` e repassar `userId` a `CarismaService.create`, `addCarismaToPessoa` e `update`; gravar `cadastradoPorId`+`atualizadoPorId` no create de `carisma`/`pessoaCarisma` e `atualizadoPorId` no update; verificar com testes unitários de `carisma.service.spec.ts` (autoria gravada no create/update e `pessoaCarisma` no fluxo de pessoa)
- [x] 2.2 Atualizar e2e de `carisma` para cobrir 201/200 com auditoria persistida e corpo de resposta sem `cadastradoPorId`/`atualizadoPorId`; verificar com `npm run test:e2e -- test/carisma` (ou suíte equivalente)

## 3. Wiring — comunidade, comunidadePessoa, comunidadeHistorico e comunidadeEtapa

- [x] 3.1 Em `ComunidadeController`, injetar `@CurrentUser('id')` em `POST`, `POST :id/pessoa/:pessoaId` e `PATCH :id`; repassar `userId` a `ComunidadeService.create`, `adicionarPessoa` e `update`; gravar auditoria em `comunidade` e `comunidadePessoa` e repassar `userId` a `historicoService.create` (`comunidadeHistorico`, parâmetro opcional); verificar com testes unitários de `comunidade.service.spec.ts`
- [x] 3.2 Em `EtapaComunidadeController`, injetar `@CurrentUser('id')` em `POST` e `PATCH` e gravar auditoria em `comunidadeEtapa` via `EtapaComunidadeService.create/update`; verificar com testes unitários de `etapa-comunidade.service.spec.ts`
- [x] 3.3 Atualizar e2e de `comunidade` e de etapa da comunidade cobrindo auditoria persistida e não exposição nos corpos; verificar com `npm run test:e2e -- test/comunidade`

## 4. Wiring — equipe e equipePessoa

- [x] 4.1 Em `EquipeController`, injetar `@CurrentUser('id')` em `POST` e `PATCH`; repassar `userId` a `EquipeService.create/update` e a `syncEquipePessoas`, gravando auditoria em `equipe` e no upsert de `equipePessoa`; verificar com testes unitários de `equipe.service.spec.ts`
- [x] 4.2 Atualizar e2e de `equipe` cobrindo auditoria persistida e não exposição; verificar com `npm run test:e2e -- test/equipe`

## 5. Wiring — paroquia, diocese e localidade

- [x] 5.1 Injetar `@CurrentUser('id')` em `POST`/`PATCH` de `ParoquiaController`, `DioceseController` e `LocalidadeController`, repassando `userId` aos serviços e gravando auditoria nos creates/updates; verificar com testes unitários dos três serviços
- [x] 5.2 Atualizar e2e de `paroquia`, `diocese` e `localidade` cobrindo auditoria persistida e não exposição; verificar com `npm run test:e2e` nas suítes dos três recursos

## 6. Wiring — endereco com autenticação opcional (pais/estado/cidade/pessoaEndereco)

- [x] 6.1 Em `EnderecoController`, adicionar `OptionalAuthGuard` + `@CurrentUser('id')` nas rotas de escrita (`POST /pessoa/:id`, `PATCH :id`) e repassar `userId` a `EnderecoService.createByPessoaId/create/update`; gravar auditoria em `endereco` e repassar `userId` (opcional) a `PaisService.create`, `EstadoService.createOrSelect`, `CidadeService.createOrSelect` e `pessoaEndereco.create`; verificar com testes unitários (com e sem `userId`)
- [x] 6.2 Adicionar e2e: `POST /endereco/pessoa/:id` sem token continua 201/200 com auditoria NULL; com token válido grava a autoria; corpo sem campos de auditoria; verificar com `npm run test:e2e -- test/endereco`

## 7. Wiring — configuracoes: pais, estado-civil e avisos

- [x] 7.1 Em `PaisController`, adicionar `OptionalAuthGuard` + `@CurrentUser('id')` no `POST /pais` e gravar auditoria em `PaisService.create` (mantendo o parâmetro opcional para o fluxo de endereco); em `EstadoCivilController`, injetar `@CurrentUser('id')` no `POST` e gravar em `EstadoCivilService.create`; em `AvisosController`, injetar `@CurrentUser('id')` em `POST`/`PATCH` e gravar em `AvisosService.create/update`; verificar com testes unitários dos três serviços
- [x] 7.2 Atualizar/adicionar e2e de `pais` (público com token → autoria; sem token → NULL), `estado-civil` e `avisos` (autoria + não exposição); verificar com `npm run test:e2e` nas suítes dos três recursos

## 8. Wiring — casal (pessoaCasal)

- [x] 8.1 Em `PessoaController.createCasal`, injetar `@CurrentUser('id')` e repassar `userId` a `CasalService.createCasal`, gravando auditoria no `pessoaCasal` criado; verificar com testes unitários de `casal.service.spec.ts`
- [x] 8.2 Atualizar e2e de `POST /pessoa/casal` cobrindo auditoria persistida e não exposição; verificar com `npm run test:e2e` na suíte de pessoa

## 9. Não exposição global dos campos de auditoria

- [x] 9.1 Criar o interceptor global `AuditoriaInterceptor` que remove `cadastradoPorId`/`atualizadoPorId` (recursivamente) dos objetos do payload final, registrado antes do `PaginationInterceptor` em `main.ts`; verificar com teste unitário do interceptor (objeto, array e aninhamento)
- [x] 9.2 Adicionar regressão e2e: respostas de criação/leitura de `pessoa`, `comunidade`, `carisma`, `avisos` e `endereco` não contêm os campos de auditoria e o envelope `{ server, total, page, limit, data }` permanece; verificar com `npm run test:e2e` nas suítes citadas

## 10. Política de NULL nas tabelas sem rota de escrita

- [x] 10.1 Confirmar que tabelas sem rota de escrita (`setor`, `regiao`, `macroRegiao`, `escolaridade`, `situacaoReligiosa`, `tipoDiocese`, `tipoEquipe`, `tipoLocalidade`, `etapa`, `passaportePessoa`) não recebem wiring; verificar com `npm run seed` e consulta (`npx prisma studio`/script) de que os registros seed dessas tabelas têm `cadastradoPorId`/`atualizadoPorId` NULL

## 11. Documentação da regra para novas tabelas

- [x] 11.1 Adicionar em `AGENTS.md`, na seção "Princípios Mandatórios de Engenharia", a subseção **2.4 "Campos de Auditoria Obrigatórios"** exigindo `cadastradoPorId`, `atualizadoPorId`, `createdAt` e `updatedAt` em toda nova tabela (padrão `pessoa`, com as exclusões `user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution`, `ScheduledJobStatus` e tabelas de vínculo simples); adicionar nota em `CLAUDE.md` em "Convenções transversais" apontando para a regra; verificar com `grep -n "cadastradoPorId" AGENTS.md CLAUDE.md`
- [x] 11.2 Confirmar que a regra documentada não menciona criação de `CONTEXT.md` e que `AGENTS.md` continua sendo o manual canônico; verificar por leitura das seções alteradas

## 12. Verificação integrada

- [x] 12.1 Executar `npm run lint`, `npm run build`, `npm test` e `npm run test:e2e`; verificar que todas as suítes passam
- [x] 12.2 Executar `openspec validate auditoria-usuario-criacao-edicao --strict`; verificar que o change está válido

## Workflow follow-up

- Aplicar os deltas nas specs principais via `openspec sync specs` ou `openspec archive` após a implementação e a revisão.
- Arquivar o change e verificar que as specs principais passam em `openspec validate --strict`.
