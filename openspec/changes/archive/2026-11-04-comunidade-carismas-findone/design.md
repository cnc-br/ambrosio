# Design

## Context

See `proposal.md` — Why. The `ComunidadeService.findOne` today returns etapa, `comunidadeEtapas` e paróquia, mas não preenche o atributo `carismas: ComunidadeCarisma[]` declarado no pacote `neocatecumenal`.

Requisitos do contrato `ComunidadeCarisma` (in `neocatecumenal`):
```ts
interface ComunidadeCarisma {
  id: number;            // carisma.id
  descricao: string;     // carisma.descricao
  tipo: TipoCarismaEnum; // carisma.tipo
  pessoas: [{
    id: number;          // pessoa.id
    externalId: string;  // pessoa.externalId
    nome: string;        // do schema saopedro (externo)
    casal: boolean;
    conjugue?: { id: number; nome: string; externalId: string; };
  }];
}
```

Pontos do modelo de dados relevantes (`prisma/schema.prisma`):
- `comunidade.comunidadePessoas → comunidadePessoa.pessoa → pessoa.pessoaCarismas → pessoaCarisma.carisma`.
- A tabela local `pessoa` **não** guarda `nome`; ela guarda apenas `externalId`. O `nome` e o `nome` do cônjuge vêm da API externa São Pedro (`schema saopedro`), conforme o padrão já usado em `PessoaService.getConjugue` e na serialização (`pessoa.serializer.ts` linha 31 e `pessoa.service.ts:254-262`).
- `pessoaCasal` é uma relação local com `marido`/`mulher`; para saber se a pessoa tem cônjuge e obter o `nome`/`externalId` dele é preciso consultar a tabela externa via `externalId`.
- O carisma tem `casalAndaJunto` (ex.: Responsável, Co-Responsável, Catequistas) — quando `true`, a pessoa entra com `casal: true` e o cônjuge é resolvido.

## Goals / Non-Goals

**Goals:**
- Preencher `carismas` na resposta do `findOne` de comunidade, agregando as pessoas da comunidade por carisma.
- Reaproveitar o padrão existente de resolução de dados externos (nome, conjugatione) já usado em `PessoaService`.
- Produzir um shape fiel ao tipo `ComunidadeCarisma` de `neocatecumenal`.

**Non-Goals:**
- Não alterar `findAll` nem os demais métodos de comunidade.
- Não criar migrations nem alterar o schema Prisma.
- Não duplicar carismas: `carismas` é um array com um item **por carisma**, cada um com a lista de `pessoas` que o possuem.
- Sem paginação ou filtros adicionais sobre carismas.

## Decisions

**D1 — Incluir a cadeia `comunidadePessoas → pessoa → pessoaCarismas` no `findOne`.**
No `include` de `findOne`, adicionar:
```ts
comunidadePessoas: {
  include: {
    pessoa: {
      include: {
        pessoaCarismas: PESSOA_CARISMA_INCLUDE, // já existente em src/prisma/includes.ts
      },
    },
  },
},
```
_Rationale_: é a via direta entre comunidade e os carismas das pessoas. Alternativa: consultar `pessoaCarisma` com `where: { pessoa: { comunidadePessoas: { some: { comunidadeId } } } }` — mais uma query; o include mantém tudo em uma única consulta pelo aninhamento.

**D2 — Resolver `nome`/`conjugue` via `SaoPedroPessoaService` por pessoa/cônjuge, seguindo o padrão de `PessoaService`.**
Como `nome` e o nome do cônjuge vivem na API externa, o `carismas` de cada pessoa precisa dos `externalId`s (locais) e de uma chamada externa para obter os nomes. Recomenda-se:
  1. Com o retorno do include, montar a lista de `pessoa.externalId` e a lista de `externalId` dos cônjuges.
  2. Buscar os dados externos (idealmente em lote via `findAllPessoas`/método de lookup por UUID, se disponível) e montar um mapa `externalId → { nome, externalId }`.
  3. Para cada carisma, agregar suas pessoas e preencher `nome`, `casal` e `conjugue`.

_Rationale_: segue o padrão consolidado em `PessoaService.getConjugue` (linhas 224-263). Alternativa rejeitada: resolver nome via `PessoaService.findOne` por pessoa — N+1 para cada pessoa/cônjuge.

**D3 — Determinar `casal` e `conjugue` a partir de `pessoaCasal` + `carisma.casalAndaJunto`.**
- Para carismas que andam em casal (`casalAndaJunto: true`), gera **um item por casal**: o **marido** como pessoa principal e a **mulher** em `conjugue` — mesmo quando só um dos dois possui o carisma.
- `casal: true` sempre que o casal é resolvido; o item nunca fica com a mulher como principal.
- O `id`/`externalId` do marido e da mulher vêm do `pessoaCasal` (a pessoa pode estar como marido ou como mulher); os nomes vêm da API externa.
- Carismas que **não** andam em casal (`casalAndaJunto: false`) continuam como itens individuais, com `casal: false` e sem `conjugue`.

**D4 — Agrupar pessoas por carisma no serializer.**
No `comunidade.serialize.ts`, adicionar a montagem de `carismas`: um array como `carisma.id`/`descricao`/`tipo` como chave, e `pessoas` = as pessoas da comunidade que possuem aquele `pessoaCarisma`. Caso a comunidade não tenha pessoas com carisma, retornar `[]` (o tipo já é opcional, mas o spec exige array vazio).

## Risks / Trade-offs

- **Dependência da API externa São Pedro para `nome`/`conjugue`**: se a API externa estiver indisponível ou faltar algum registro, a serialização de `carismas` pode falhar ou devolver nomes ausentes → seg** Mitigation**: tratar falha externa de forma resiliente (logar e seguir sem o `nome`/`conjugue` quando o registro externo não for encontrado), similar ao `fetchExternalContatos` que faz catch e devolve `[]`.
- **Volume de chamadas externas**: buscar nome de cada pessoa/cônjuge individualmente gera N+1 → **Mitigation**: colher `externalId`s primeiro e buscar em lote/mapa.
- **Desempenho da query aninhada**: comunidades grandes com muitas pessoas podem inflar o payload → pouco impacto para o caso de `findOne` de uma comunidade; aceito.

## Open Questions

- A API externa define hoje um método de lookup em lote por lista de UUIDs? Em caso negativo, o plano de tasks deve considerar resolver os nomes pessoa a pessoa (degrada performance) ou restringir o lote. A ser confirmado durante a implementação sem alterar o contrato de saída.

**Resolvida (usuário)**: o `nome` de cada pessoa e do cônjuge será resolvido pela API externa São Pedro via `externalId`, seguindo o padrão de `PessoaService.getConjugue`/`findExternalPessoaByUuid`. Não há caminho local para `nome` na tabela `pessoa` do schema ambrosio. A otimização em lote fica como detalhe de implementação (preferível buscar todos os `externalId`, inclusive dos cônjuges, de uma vez sempre que a API externa permitir).