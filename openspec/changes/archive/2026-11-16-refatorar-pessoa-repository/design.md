# Design

## Context

Ver `proposal.md` — Why. O estado atual relevante:

- `PessoaService` usa `PrismaService` diretamente em criação, listagem, busca por CPF/externalId/id, atualização e validação de escopo. `CasalService` acessa `prisma.pessoa` e `prisma.pessoaCasal` diretamente.
- As condições de autorização são geradas pelo CASL (`accessibleBy(ability, action).pessoa`) e já têm o formato de `Prisma.pessoaWhereInput`; os serviços as repassam ao Prisma.
- O filtro global `PrismaExceptionsFilter` traduz `P2025` em 404. Os testes dependem dessa propagação (ex.: `casal.service.spec.ts` e `contato.service.spec.ts`).
- A suíte unitária usa Vitest + `TestingModule` com `PrismaService` mockado; os testes e2e (`test/pessoa/*`) exercitam os endpoints reais.
- O projeto usa ESM com sufixo `.js` nos imports e alias `src/*`; o client é importado de `src/prisma/generated-client.js`.
- Não existe padrão de repository no repositório hoje.

## Goals / Non-Goals

**Goals:**

- Remover o acesso direto a `PrismaService` de `PessoaService` e `CasalService`.
- Centralizar os `include`/`select` e o acesso às tabelas `pessoa` e `pessoaCasal` em repositórios finos e tipados.
- Preservar assinaturas públicas dos serviços, contratos HTTP, mensagens de erro, serialização e ordem/forma das consultas.
- Deixar os serviços testáveis com mocks de repositório, sem mockar o client do Prisma.

**Non-Goals:**

- Mapear Prisma para modelos de domínio (o repositório expõe tipos do Prisma).
- Introduzir transações, unit of work, cache, paginação nova ou query builder genérico.
- Refatorar `ContatoService`, outros módulos ou o `PrismaModule`.
- Alterar schema, migrations, DTOs ou endpoints.

## Decisions

### 1. Um repositório por tabela do agregado: `PessoaRepository` e `PessoaCasalRepository`

`PessoaRepository` cobre a tabela `pessoa`; `PessoaCasalRepository` cobre `pessoaCasal`. Ambos ficam em `src/pessoa/repositories/`.

Por quê: o CASL filtra por `pessoa`, e as operações de casal têm ciclo de vida próprio. Separar mantém cada classe coesa e evita um repositório que acumula responsabilidades de duas tabelas.

Alternativas consideradas:
- **Um único `PessoaRepository` com tudo** — rejeitado por virar um objeto genérico difícil de navegar e por misturar agregados.
- **`BaseRepository<T>` genérico** — rejeitado: vaza detalhes do Prisma, esconde a intenção das consultas e não traz ganho com apenas dois repositórios.

### 2. Repositório fino, tipado com Prisma, sem mapeamento de domínio

As assinaturas recebem tipos de entrada do Prisma e devolvem payloads do Prisma:

- Entradas: `Prisma.pessoaWhereInput`, `Prisma.pessoaWhereUniqueInput`, `Prisma.pessoaUncheckedCreateInput`, `Prisma.pessoaUncheckedUpdateInput`, `Prisma.pessoaCasalWhereInput`, `Prisma.pessoaCasalUncheckedCreateInput`.
- Saídas: aliases derivados dos includes, por exemplo `Prisma.pessoaGetPayload<{ include: typeof PESSOA_DETALHE_INCLUDE }>`.

Por quê: a condição do CASL é um `Prisma.pessoaWhereInput` profundo. Traduzi-la para um modelo de domínio exigiria reproduzir filtros aninhados de `comunidadePessoas`/`paroquia`/`usuarioParoquias`, com alto risco de regressão silenciosa. O repository fino entrega o seam de testabilidade sem mudar comportamento observável.

Alternativas consideradas:
- **Repositório orientado a domínio** — adiado; pode ser uma evolução posterior, com testes de contrato que garantam a equivalência.
- **Manter Prisma nos serviços** — rejeitado; é o problema que o change resolve.

### 3. Formas de consulta centralizadas no módulo de repositórios

Criar `src/pessoa/repositories/pessoa.includes.ts` com as formas persistenciais:

- `PESSOA_DETALHE_INCLUDE`: `situacaoReligiosa`, `pessoaCarismas` (`PESSOA_CARISMA_INCLUDE`), `comunidadePessoas` (com `comunidade.paroquia` via `PAROQUIA_SELECT`) e `enderecos` (`ENDERECO_INCLUDE`) — extraído do `findBy` atual.
- `PESSOA_LISTAGEM_INCLUDE`: `situacaoReligiosa`, `pessoaCarismas` e `enderecos` — extraído do `findMany` atual.
- `PESSOA_BASICA_SELECT`: `id` e `externalId` — usado para cônjuge e listagem de elegíveis.

Os includes existentes em `src/prisma/includes.ts` e os selects de paróquia são reutilizados sem alteração.

Métodos previstos, nomeados por intenção e restritos a chamadores reais:

`PessoaRepository`
- `create(data)`
- `deletePorId(id)`
- `findManyParaListagem({ where, skip, take })` — mantém `orderBy: { id: 'desc' }` interno.
- `findDetalhadoOrThrow(where: Prisma.pessoaWhereUniqueInput)` — substitui o `findBy` privado.
- `findUniquePorExternalId(externalId: string)`
- `findBasicoPorIdOrThrow(id: number)`
- `findNoEscopo(id: number, escopo: Prisma.pessoaWhereInput)` — `findFirst` com `AND: [{ id }, escopo]`.
- `findUniqueOrThrowPorId(id: number)`
- `findManyElegiveisCasal({ where })` — `select` básico para o fluxo de cônjuges.
- `updatePorId(id: number, data)`

`PessoaCasalRepository`
- `create(data)`
- `findFirst(where)`

### 4. Autorização permanece no serviço

`PessoaService` e `CasalService` continuam chamando `accessibleBy`/`validate*Ability` e passam o `where` já montado ao repositório. O repositório não conhece CASL nem usuário.

Por quê: autorização é regra de negócio e precisa permanecer testável no serviço; escondê-la no repositório dificultaria auditar quem filtra o quê.

### 5. Injeção de dependência local ao `PessoaModule`

Os dois repositórios são `@Injectable()` e entram em `providers` do `PessoaModule`. Não são exportados neste change, pois nenhum outro módulo precisa deles; módulos externos continuam consumindo `PessoaService`.

### 6. Sem tradução de erros nos repositórios

Repositórios não capturam nem convertem erros do Prisma. `findUniqueOrThrow` e `findFirstOrThrow` continuam sendo usados onde o 404 depende de `P2025`, preservando o `PrismaExceptionsFilter`. O rollback compensatório (`delete`) permanece no serviço, que é o dono da orquestração.

### 7. Testes: mockar repositórios nos serviços e verificar delegação nos repositórios

- `pessoa.service.spec.ts` e `casal.service.spec.ts` passam a prover `PessoaRepository` e `PessoaCasalRepository` com `useValue`. As asserções que hoje inspecionam `prismaMock.pessoa.*` passam a inspecionar os métodos do repositório, mantendo as mesmas expectativas de `where`/`data` quando o formato é contrato do fluxo.
- Cada repositório ganha um `.spec.ts` com `PrismaService` mockado, verificando que as opções de consulta (`where`, `include`, `select`, `orderBy`, `skip`, `take`) são repassadas e que erros do Prisma propagam. Os testes são escritos antes da implementação.
- Testes e2e existentes não mudam e funcionam como verificação de comportamento fim a fim.

## Risks / Trade-offs

- **Drift de `include`/`select`/`orderBy` ao mover para constantes** → mover o conteúdo literalmente, sem “melhorias”, e validar com os testes unitários e e2e existentes.
- **Repositórios virarem repasses anêmicos** → expor apenas métodos com chamador real; não criar API especulativa. O ganho inicial é o seam de teste e a centralização das formas de consulta.
- **Asserções de teste excessivamente acopladas ao formato Prisma** → nos specs de repositório, verificar a delegação e o formato; nos specs de serviço, verificar a intenção (ex.: chamada com `escopo`), reduzindo acoplamento sem perder a cobertura das regras de escopo.
- **Esquecer `P2025` e transformar 404 em erro genérico** → manter `findUniqueOrThrow` interno e cobrir a propagação nos specs de serviço e repositório.
- **Imports ESM quebrados** → seguir o padrão existente (`src/...js`) e rodar build/testes após a refatoração.
- **Escopo do `PessoaModule` crescer** → manter um arquivo por tabela e as formas de consulta em arquivo separado; futuros repositórios de outros módulos podem seguir o mesmo desenho.

## Migration Plan

1. Criar os repositórios e seus testes (TDD), ainda sem alterar os serviços.
2. Refatorar `PessoaService` para consumir `PessoaRepository`/`PessoaCasalRepository`; ajustar o spec do serviço; rodar `npm run test`.
3. Refatorar `CasalService` e seu spec; rodar `npm run test`.
4. Rodar `npm run test:e2e` e `npm run build`.
5. Rollback: reverter o commit; não há migration, feature flag ou mudança de contrato. Como não há alteração de dados, o deploy é de baixo risco e pode seguir o fluxo normal da API.