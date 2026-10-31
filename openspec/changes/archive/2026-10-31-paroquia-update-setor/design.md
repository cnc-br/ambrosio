# Design

## Context

`ParoquiaService.update` (src/paroquia/paroquia.service.ts) hoje grava `setorId: updateParoquiaDto.setor.id` de forma incondicional dentro da transação. Como `UpdateParoquiaDto` deriva de `PartialType(CreateParoquiaDto)`, `setor` é **opcional** no payload — logo um `PATCH /paroquia/:id` sem `setor` lança `TypeError` (lido dentro do try/catch) e responde 502. O teste e2e existente "deve atualizar uma paroquia com campos válidos" (`test/paroquia.e2e-spec.ts`) não envia `setor` e quebraria. Não existe nenhum teste (unit ou e2e) cobrindo a persistência do `setor` na atualização. Ver `proposal.md` para a motivação.

Constraints relevantes:
- `PAROQUIA_SELECT` inclui `setor: true` e `serializeParoquia` expõe `setor.id`/`descricao`/`ativo` na resposta.
- O seed cria paróquias com `setorId: 1` e 12 setores (ids 1–12), então o teste e2e pode trocar para `setor: { id: 2 }` com dados estáveis.
- O spec unit atual mocka `PrismaService` com apenas `create` e `findFirstOrThrow`; `update` atravessa `enderecoService.update` (que encadeia Pais/Estado/Cidade) e `dioceseService.findOne` — testar com toda a cadeia real é frágil.

## Goals / Non-Goals

**Goals:**
- Comportamento seguro e compatível: PATCH sem `setor` continua válido (manter setor atual); PATCH com `setor` persiste o novo vínculo.
- Cobertura unitária do `update` focado na decisão do `setorId` (enviado vs. omitido), sem depender da cadeia real endereco/diocese.
- Cobertura e2e do `PATCH /paroquia/:id` nos dois caminhos, seguindo a spec `testes-e2e`.

**Non-Goals:**
- Não tornar `setor` obrigatório no DTO nem mudar validações.
- Não alterar regras CASL de atualização.
- Não refatorar `ParoquiaService.update` além do guard necessário.

## Decisions

### 1. Guard de `setor` opcional no service

No `data` do `transaction.paroquia.update`, condicionar o `setorId` à presença de `updateParoquiaDto.setor`:

```ts
data: {
  descricao: updateParoquiaDto.descricao,
  enderecoId: endereco.id,
  dioceseId: updateParoquiaDto.diocese.id,
  ...(updateParoquiaDto.setor && { setorId: updateParoquiaDto.setor.id }),
},
```

Alternativas descartadas:
- **Manter incondicional e tornar `setor` obrigatório no DTO** — quebra de contrato (`PartialType` diz opcional) e o payload e2e existente teria que mudar; o usuário optou por manter `setor` opcional.
- **Fallback `??` para o `setorId` atual** — silencia o formato opcional corretamente, mas exige buscar o id atual fora da transação e não traz ganho sobre o spread condicional.

### 2. Testes unitários com colaboradores mockados

No `src/paroquia/paroquia.service.spec.ts`, adicionar um `describe` isolado para o `update` que:
- Estende o mock do `PrismaService` com `paroquia.findFirstOrThrow` (para o `findOne` interno) e `$transaction`, cujo mock invoca o callback com um client fake cujo `paroquia.update` é um `vi.fn()` que grava o argumento `data` recebido (e retorna a paróquia serializável).
- Faz `vi.spyOn(dioceseService, 'findOne')` e `vi.spyOn(enderecoService, 'update')` (o `enderecoService` real encadeia Pais/Estado/Cidade e não deve rodar de verdade).
- Neutraliza a habilidade com `vi.spyOn(service, 'validateUpdateAbility')` / `validateReadAbility` (`mockImplementation(() => {})`) para o teste focar na lógica de dados, não em CASL.
- Casos:
  - `setor` presente no DTO → asserta que `data.setorId` é o novo id e que o retorno serializado expõe `setor.id` novo.
  - `setor` omitido → asserta que `data` **não** contém a chave `setorId` (demais campos permanecem).
  - Assertar sobre o `data` passado ao `paroquia.update` (e não só na resposta) evita que um `TypeError` engolido pelo try/catch (502) passe o teste enganosamente.

### 3. Testes e2e no `test/paroquia.e2e-spec.ts`

Seguindo `testes-e2e` (títulos `/<rota> (MÉTODO) - <status> | <descrição>`, verificação de corpo):
- **PATCH com setor novo**: usando dados do seed (paróquia com `setorId: 1` e `setor: { id: 2 }` existente), PATCH responde 200 e `response.body.data.setor.id === 2`. Preferir criar a paróquia no próprio teste (padrão já usado no DELETE e2e) para não acoplar a ids fixos de seed.
- **PATCH sem setor**: payload com `descricao`/`diocese`/`endereco` válidos e sem `setor` responde 200; conferir que o `setor.id` retornado é o mesmo setor original da paróquia (criada no teste). Este caso também protege o teste e2e existente (linha ~358) de voltar a quebrar.

## Risks / Trade-offs

- [Regression do teste e2e existente que não envia `setor`] → Mitigação: o guard mantém 200; o novo caso "PATCH sem setor" fixa o comportamento.
- [Teste unitário passa enganosamente com 502 engolido pelo try/catch] → Mitigação: assertar o `data` recebido pelo mock de `paroquia.update`, não apenas a resposta.
- [Dependência de ids do seed nos e2e] → Mitigação: criar paróquia (e usar `setor: { id: 2 }`, existente no seed) dentro do próprio caso, como já é padrão no arquivo.
- [Mock parcial do `PrismaService` no spec unit crescer] → Mitigação: manter o `describe` de `update` isolado do teste de DI existente, com mocks locais por caso.

## Migration Plan

Sem migração de dados nem mudança de schema/API. Rollback: reverter o guard no service e remover os testes — nenhum efeito persistente.
