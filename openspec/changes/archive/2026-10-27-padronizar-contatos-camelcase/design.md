# Design

## Context

A interface `PessoaContato` (lib `neocatecumenal`) declara os campos em camelCase — `pessoaId`, `tipoTelefone`, `contatoPrincipal` —, mas a API São Pedro responde os contatos em snake_case (`pessoa_id`, `tipo_telefone`, `contato_principal`), como observado em runtime. `SaoPedroContatoService.findExternalContatos` e `createExternalContato` devolvem o payload cru, e ele chega ao cliente sem normalização (via `pessoa.serializer.ts` nos GETs de pessoa e diretamente no `POST /pessoa/:id/contato`). Na mesma working tree, o envio de criação já foi ajustado para snake_case (`CreateContatoMapper`/`ExternalCreateContatoDto`) — a direção inbound é o que falta. Motivação completa em proposal.md.

## Goals / Non-Goals

**Goals:**
- A fronteira externa (`SaoPedroContatoService`) devolve contatos em camelCase (shape honesto da interface `PessoaContato`), cobrindo leitura e criação.
- Nenhuma alteração em `pessoa.serializer.ts`, `pessoa.service.ts` nem nos mocks e2e (que substituem o serviço inteiro).
- Manter o envio em snake_case já feito, alinhando os testes que ainda assumem camelCase na fronteira.

**Non-Goals:**
- Normalizar outros recursos da São Pedro (só os contatos são snake_case; a resposta de pessoa já chega camelCase).
- Conversor genérico/recursivo de snake_case para camelCase.
- Alterar a semântica de `pessoaId` (renome de chave apenas; permanece o id da pessoa na São Pedro, não o id local).

## Decisions

### 1. Normalizar na fronteira externa, via mapper dedicado

Criar `src/external/sao-pedro/mapper/contato-response.mapper.ts` com `toDomain(external): PessoaContato` e `toDomainList(external[]): PessoaContato[]`, mapeando explicitamente `pessoa_id → pessoaId`, `tipo_telefone → tipoTelefone`, `contato_principal → contatoPrincipal` (além de `id`, `telefone`, `email`, `observacao`), preservando `null` e campos ausentes. Aplicar em `findExternalContatos` (lista) e em `createExternalContato` (objeto único).

- **Alternativa considerada**: mapear dentro de `pessoa.serializer.ts`. Rejeitada: a resposta de criação (`POST /pessoa/:id/contato`) flui direto do serviço para o controller sem passar pelo serializer de pessoa — a normalização ficaria dividida em duas camadas e o contrato de criação continuaria quebrado.
- **Alternativa considerada**: normalização inline no serviço. Rejeitada: o serviço é fino (HTTP + auth) e o mapeamento, com `null`s, merece teste unitário isolado; o mapper espelha o padrão existente (`CreateContatoMapper`, `sao-pedro-pessoa.serializer.ts`).
- **Alternativa considerada**: converter genérico `snakeToCamel` recursivo. Rejeitada: opaco, não segue o estilo explícito do repo e arrisca casar chaves não contratuais.
- **Alternativa considerada**: tolerar entrada já em camelCase. Rejeitada: a evidência de runtime é snake_case; assumir essa entrada e padronizar os testes nela mantém o mapper simples e determinístico.

### 2. Contrato dos testes

Atualizar `sao-pedro-contato.service.spec.ts` para espelhar a realidade em **ambas** as direções: o payload enviado no POST à São Pedro em snake_case (alinhado ao `CreateContatoMapper` já alterado) e a resposta recebida em snake_case sendo devolvida em camelCase. `create-contato.mapper.spec.ts` ganha expectativas snake_case. Novo `contato-response.mapper.spec.ts` cobre o mapeamento com e sem campos nulos/omitidos. Os e2e de `pessoa-contato` não mudam: o mock substitui o serviço, que é onde a normalização mora.

## Risks / Trade-offs

- **Testes em descompasso com o WIP do usuário** (mapper de saída já em snake_case, specs antigas em camelCase) → A task list atualiza as expectativas das duas direções na mesma suíte (`sao-pedro-contato.service.spec.ts`, `create-contato.mapper.spec.ts`), mantendo `npx vitest run src/external` verde como critério por grupo.
- **`pessoaId` vira `undefined` se a São Pedro mudar o formato** → O mapper é explícito e coberto por teste unitário; se a São Pedro passar a trafegar camelCase, o teste revela na hora (campo ausente), não silenciosamente.
- **Frontend já espera camelCase** (interface `PessoaContato`) → Este change não quebra contrato; ao contrário, corrige a API para o que a interface já declara.
- **Campos nulos (`tipo_telefone`/`telefone` nulos no exemplo)** → Preservar `null` no mapper; assert no teste unitário.

## Migration Plan

Único deploy. Sem migração de dados. Rollback: reverter o commit — o mapper aplicado na fronteira não afeta persistência nem payloads enviados.

## Open Questions

Nenhuma.
