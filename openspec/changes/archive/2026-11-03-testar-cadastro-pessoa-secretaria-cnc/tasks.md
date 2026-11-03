# Tasks

## 1. Permissão CASL coberta por teste unitário

- [x] 1.1 Confirmar em `src/casl/casl-ability/casl-ability.service.ts` que o perfil `SECRETARIA_CNC` concede `can('create', 'pessoa')`, mantendo as permissões de leitura existentes — verificar por inspeção que a linha está presente no bloco `SECRETARIA_CNC` e que nenhuma outra regra foi alterada
- [x] 1.2 Adicionar em `src/casl/casl-ability/casl-ability.service.spec.ts` um caso que cria a ability para um usuário `SECRETARIA_CNC` e verifica `ability.can('create', 'pessoa')` verdadeiro (e `ability.can('read', 'pessoa')` inalterado) — verificar com `npm test -- casl-ability.service`
- [x] 1.3 Adicionar no mesmo spec uma verificação de que um usuário `NAO_IDENTIFICADO` continua sem `create` sobre `pessoa` — verificar com `npm test -- casl-ability.service`

## 2. Cenários e2e do SECRETARIA_CNC em pessoa-create

- [x] 2.1 Em `test/pessoa/pessoa-create.e2e-spec.ts`, autenticar também o usuário de seed `secretaria@admin.com` no `beforeAll` e armazenar o token em `tokenSecretariaCnc` — verificar que a suíte inicializa sem erro (`npm run test:e2e -- pessoa-create`)
- [x] 2.2 Adicionar o caso `/${principal} (POST) - 201 | SECRETARIA_CNC cadastra pessoa` usando token de `SECRETARIA_CNC`, payload válido e mocks isolados de `getExternalPessoaByCpf` (`mockResolvedValueOnce(null)`) e `createExternalPessoa` (`mockResolvedValueOnce` com `externalId` único por execução, ex.: `e2e-pessoa-secretaria-${Date.now()}`) — verificar que responde 201 e que o corpo contém `id`, `nome` e `cpf` esperados
- [x] 2.3 Adicionar fixture no `beforeAll` (via `PrismaService`, no padrão de `test/comunidade.e2e-spec.ts`) de um usuário `SECRETARIA_CNC` sem vínculo em `usuarioParoquia` e, no mesmo caso de sucesso, cobrir o cenário `/${principal} (POST) - 201 | SECRETARIA_CNC sem paroquia cadastra pessoa`, com mocks de `externalId` próprio — verificar que responde 201
- [x] 2.4 Reexecutar os casos existentes de 401 (sem token) e 403 (`ronaldinho@admin.com`, perfil sem permissão) na mesma suíte para confirmar que continuam bloqueando o cadastro — verificar com `npm run test:e2e -- pessoa-create`

## 3. Verificação de integração

- [x] 3.1 Executar `npm run lint` e `npm run build` sem erros
- [x] 3.2 Executar `npm run test` (unitários) e confirmar que a suíte do CASL passa
- [x] 3.3 Executar `npm run test:e2e` completo e confirmar que `pessoa-create`, `pessoa-contato` e `comunidade` passam, validando que a nova permissão não quebrou os fluxos que reutilizam `create pessoa`

## 4. Permissão de atualização e enforcement

- [x] 4.1 Adicionar `can('update', 'pessoa')` no bloco `SECRETARIA_CNC` de `src/casl/casl-ability/casl-ability.service.ts`, mantendo `read` e `create` — verificar por inspeção que as três regras estão presentes
- [x] 4.2 Adicionar `this.validateUpdateAbility('pessoa')` como primeira instrução de `PessoaService.update` em `src/pessoa/pessoa.service.ts` — verificar que a chamada ocorre antes de `findOne`/banco
- [x] 4.3 Adicionar em `src/pessoa/pessoa.service.spec.ts` um teste em que um usuário `NAO_IDENTIFICADO` chama `update` e recebe `ForbiddenException` sem que `prisma.pessoa.findUniqueOrThrow` seja chamado — verificar com `npm test -- pessoa.service`
- [x] 4.4 Adicionar em `src/casl/casl-ability/casl-ability.service.spec.ts` asserções de `can('update', 'pessoa')` verdadeiro para `SECRETARIA_CNC` e falso para `NAO_IDENTIFICADO` — verificar com `npm test -- casl-ability.service`
- [x] 4.5 Em `test/pessoa/pessoa-create.e2e-spec.ts`, substituir `SaoPedroContatoService` por `mockSaoPedroContatoService` no `setupTestModule` e criar no `beforeAll` uma pessoa fixture via `POST /pessoa` como `ADMIN`, com `externalId` único de até 36 caracteres, guardando o `id` — verificar que a suíte inicializa sem erro
- [x] 4.6 Adicionar os casos `/${principal}/:id (PATCH) - 401 | nao pode atualizar pessoa sem autenticacao`, `/${principal}/:id (PATCH) - 403 | nao pode atualizar pessoa sem permissao` (com `ronaldinho@admin.com` e mensagem `Você não tem permissão para update pessoa`), `/${principal}/:id (PATCH) - 200 | SECRETARIA_CNC atualiza pessoa` e `/${principal}/999999 (PATCH) - 404 | nao atualiza pessoa inexistente` — verificar com `npx vitest run --config ./vitest.config.e2e.ts pessoa-create`
- [x] 4.7 Adicionar o caso `/${principal}/:id (PATCH) - 200 | ADMIN atualiza pessoa` para preservar o comportamento do perfil administrador — verificar com `npx vitest run --config ./vitest.config.e2e.ts pessoa-create`

## 5. Verificação final

- [x] 5.1 Executar `npm run lint` e `npm run build` sem erros
- [x] 5.2 Executar `npm run test` e confirmar que as suítes de CASL e de pessoa passam
- [x] 5.3 Executar `npm run test:e2e` completo e confirmar que as 17 suítes passam, incluindo `pessoa-create`, `pessoa-contato` e `comunidade`
