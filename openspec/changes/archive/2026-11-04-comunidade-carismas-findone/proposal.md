# Proposal

## Why

A comunidade precisa expor os **carismas** (responsável, co-responsável, catequista, etc.) e as **pessoas** que ocupam esses papéis, incluindo o cônjuge quando aplicável. Hoje o endpoint `findOne` de comunidade retorna apenas dados gerais, etapa e paróquia — falta o atributo `carismas` que o tipo `Comunidade` do pacote `neocatecumenal` já declara. Preencher esse atributo permite ao frontend exibir os responsáveis da comunidade num único acesso.

## What Changes

- Popular o atributo `carismas` no objeto de resposta do `findOne` de comunidade (`src/comunidade/comunidade.service.ts`), conforme o tipo `ComunidadeCarisma` de `neocatecumenal`.
- `carismas` é um array de carismas onde cada item contém `id`, `descricao`, `tipo` e `pessoas` (as pessoas da comunidade que possuem aquele carisma).
- Cada pessoa em `pessoas` carrega `id`, `externalId`, `nome`, `casal` (booleano) e `conjugue` (nome/`externalId` do cônjuge, quando o carisma anda em casal) — derivados da relação `comunidadePessoas → pessoa.pessoaCasal`.
- A alteração atinge apenas a função `findOne`; `findAll` e demais métodos permanecem inalterados.

## Capabilities

### New Capabilities
- `comunidade`: Capacidade que reúne os requisitos do recurso de comunidades (consultar, cadastrar, atualizar, relacionar pessoas e expor carismas). Ainda não existe spec canônica para `comunidade`; este change inaugura a capability focada no requisito de expor carismas no `findOne`.

### Modified Capabilities
<!-- Nenhuma capability existente muda. -->

## Impact

- **Código**: `src/comunidade/comunidade.service.ts` (adicionar `include` em `findOne`), `src/comunidade/comunidade.serialize.ts` (serializar `carismas`).
- **Tipos**: dependente do contrato `Comunidade`/`ComunidadeCarisma` em `neocatecumenal`.
- **Testes**: `src/comunidade/comunidade.service.spec.ts` e, possivelmente, teste e2e do controller.
- **Dados**: somente leitura (busca via Prisma). Sem migrations, sem mudança de schema.
- **API**: a resposta de `GET /comunidade/:id` passa a incluir o campo `carismas`.