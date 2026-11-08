# Tasks

## 1. Expor a validação de escopo no `ComunidadeService`

- [x] 1.1 Tornar `validarComunidadeDentroDoEscopoDeAtualizacao` pública em `src/comunidade/comunidade.service.ts` (sem alterar comportamento) e verificar que a suíte `comunidade.service.spec.ts` continua passando e o build compila.

## 2. Refatorar `PessoaService.create` (responsabilidades separadas + `comunidadeId`)

- [x] 2.1 Criar os métodos privados `validarVinculoComunidade`, `criarPessoaCompleta` e `vincularPessoaNaComunidade` em `src/pessoa/pessoa.service.ts`, mantendo `create(createPessoaDto, comunidadeId?)` como orquestração enxuta sem o bloco atual de `criarPessoaCompleta` acoplado ao corpo do `create`.
- [x] 2.2 Fazer `create` validar o escopo da comunidade **antes** de qualquer escrita quando `comunidadeId` for informado: `validarVinculoComunidade` chama `comunidadeService.validarComunidadeDentroDoEscopoDeAtualizacao(comunidadeId)` e não cria pessoa quando lança 404/403.
- [x] 2.3 Fazer `vincularPessoaNaComunidade` chamar `comunidadeService.adicionarPessoa(comunidadeId, pessoa.id)` e, em caso de erro, remover a pessoa local recém-criada (`prisma.pessoa.delete`) e repropagar o erro.
- [x] 2.4 Implementar testes unitários em `src/pessoa/pessoa.service.spec.ts` com mocks de `ComunidadeService`/Prisma/externos cobrindo: validação prévia chamada antes de qualquer create (e sem criar pessoa externa/local em 404/403); vínculo chamado com a pessoa criada; compensação (delete local) quandoo vínculo lança; `comunidadeId` ausente mantém o comportamento atual. Verificar a suíte passando.

## 3. Query param `comunidadeId` no controller

- [x] 3.1 Adicionar `@Query('comunidadeId', new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE })) comunidadeId?: number` em `src/pessoa/pessoa.controller.ts`, repassando ao `create`, com Swagger `@ApiQuery` e `@ApiNotAcceptableResponse`.
- [x] 3.2 Atualizar `src/pessoa/pessoa.controller.spec.ts` (delegação do `comunidadeId` ao service e presença do metadata Swagger de `406`) e verificar a suíte passando.

## 4. Testes e2e

- [x] 4.1 Estender `test/pessoa/pessoa-create.e2e-spec.ts` cobrindo: `POST /pessoa?comunidadeId=N` em comunidade da própria paróquia → 201 com pessoa criada e vínculo `comunidadePessoa` criado; comunidade inexistente → 404 **sem criar pessoa** (externa nem local); comunidade fora do escopo → 403 **sem criar pessoa** nem vínculo; `comunidadeId=abc` → 406; sem `comunidadeId` → 201 sem vínculo. Verificar a suíte e2e passando.

## 5. Verificação final

- [x] 5.1 Rodar `npm run test` e a suíte e2e completa com sucesso e conferir que o Swagger documenta o query param `comunidadeId` em `POST /pessoa`.

## Workflow follow-up

- Arquivar o change após revisão (`/opsx-archive`) e verificar o resultado arquivado.
