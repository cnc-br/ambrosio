# Proposal

## Why

Na página de comunidades do frontend, o usuário quer cadastrar uma pessoa já vinculada àquela comunidade. O cadastro de pessoa já existe (`POST /pessoa`), mas não aceita vínculo com comunidade — e o `comunidadeId` vindo da URL pode ser adulterado, permitindo vincular a pessoa a uma comunidade fora das paróquias do usuário. Esse escopo já é validado em `validarComunidadeDentroDoEscopoDeAtualizacao` (usado por `adicionarPessoa`), mas apenas no fluxo de comunidade, depois que a pessoa já existe.

## What Changes

- `POST /pessoa` passa a aceitar o query param opcional `comunidadeId` (inteiro). Quando informado:
  - Valida **antes** de criar qualquer registro que a comunidade existe e está dentro do escopo de atualização do usuário (`validarComunidadeDentroDoEscopoDeAtualizacao`), respondendo `404` para comunidade inexistente e `403` para comunidade fora das paróquias vinculadas — sem efeitos colaterais.
  - Após criar a pessoa (API externa + tabela local), vincula a pessoa à comunidade via `ComunidadeService.adicionarPessoa` (reutilizando a regra existente).
  - Se, apesar da validação prévia, o vínculo falhar (caso residual de falha de banco), compensa desfazendo o cadastro local da pessoa recém-criada e repassa o erro — nunca deixando pessoa cadastrada sem o vínculo solicitado.
- `validarComunidadeDentroDoEscopoDeAtualizacao` deixa de ser `private` no `ComunidadeService` para permitir a validação prévia no fluxo de pessoa (comportamento inalterado, apenas visibilidade).
- `PessoaService.create` é refatorado para não crescer: delega a responsabilidades privadas (`validarVinculoComunidade`, `criarPessoaCompleta`, `vincularPessoaNaComunidade`), mantendo `create()` como orquestração enxuta.
- Sem `comunidadeId`, o comportamento do `POST /pessoa` permanece idêntico ao atual.
- Sem **BREAKING**.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `pessoa`: o cadastro de pessoa passa a aceitar vinculação opcional com uma comunidade — incluindo a validação de escopo de paróquia **antes** da criação (404/403, sem efeitos colaterais) e o vínculo após a criação -, e passa a rejeitar `comunidadeId` não numérico com `406`. A regra de escopo em si não muda (reuso da validação existente documentada em `escopo-acesso-paroquia`).

## Impact

- **API**: `POST /pessoa?comunidadeId=<int>` (query param opcional) + anotações Swagger (`@ApiQuery`, `@ApiNotAcceptableResponse`).
- **Código**:
  - `src/pessoa/pessoa.controller.ts` — novo query param com `ParseIntPipe` opcional e documentação Swagger.
  - `src/pessoa/pessoa.service.ts` — `create()` recebe `comunidadeId?`, orquestra passos delegados e inclui compensação de vínculo.
  - `src/comunidade/comunidade.service.ts` — `validarComunidadeDentroDoEscopoDeAtualizacao` passa a ser pública (para reuso).
  - `src/pessoa/pessoa.module.ts` — sem alterações (já importa `ComunidadeModule`).
- **Testes**: unitários (service: validação prévia sem criar pessoa, vínculo após criação, compensação em falha do vínculo; controller: parse de query) e e2e (403/404 antes de criar, 201 com vínculo, 406 em id não numérico, ausência do param mantém comportamento atual).
- **Sem novas dependências** externas.
