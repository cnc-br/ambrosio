# Design

## Context

`PessoaService.findAll` (src/pessoa/pessoa.service.ts, ~linhas 94-111) faz `Promise.all` de chamadas a `saoPedroContatoService.findExternalContatos(pessoa.externalId)` para **cada** pessoa da página — N chamadas HTTP externas por request de listagem. `findBy` (usado por `findOne` e `findByExternalId`) e `findOneByCpf` também usam `fetchExternalContatos`, mas ali o custo é fixo (uma pessoa). A motivação completa está no proposal.md.

A especificação `pessoa-contato` (requisito "Contatos incluídos na leitura de pessoa") passa a exigir contatos apenas nas leituras individuais e proíbe o campo na listagem — ver delta em `specs/pessoa-contato/spec.md`.

## Goals / Non-Goals

**Goals:**
- `GET /pessoa` (listagem paginada) deixa de fazer chamadas externas de contatos por pessoa — tempo de resposta da listagem deixa de escalar com `limit`.
- Leituras individuais (`GET /pessoa/:id`, `GET /pessoa?cpf=`, `GET /pessoa?externalId=`) mantêm `contatos` inalterados.
- Delimitar a mudança a `findAll` e seus testes, sem mexer em `findBy`, `findOneByCpf`, `fetchExternalContatos` nem na serialização.

**Non-Goals:**
- Otimizar a chamada externa de contatos (cache, batching, paralelismo) — fora do escopo desta mudança.
- Alterar o fluxo de criação de contato (`POST /pessoa/:id/contato`).
- Remover `contatos` das leituras individuais.

## Decisions

### 1. Remover o bloco de busca paralela e omitir `contatos` na resposta da listagem

Em `findAll`, remover o `contatosMap` + `Promise.all` e, no `serializePessoaResponse`, não passar o 4º argumento (`contatos`). Como o serializer já trata `contatos?: PessoaContato[]`, omitir o argumento deixa o campo como `undefined`, que é descartado pelo `JSON.stringify` — a listagem simplesmente não traz a chave `contatos`.

- **Alternativa considerada**: passar `[]` para manter a chave presente com array vazio. Rejeitada: a spec determina que a listagem **não inclua** o campo; manter `[]` criaria um resultado enganoso (sugerindo que a listagem conhece os contatos) e exigiria iteração extra sem valor.
- **Alternativa considerada**: gating da busca por query param (ex.: `?withContatos=true`). Rejeitada: adiciona superfície de API e custo de manutenção para um comportamento que a spec quer fixo (listagem sem contatos).

### 2. Manter `SaoPedroContatoService` injetado e `fetchExternalContatos` intactos

`findBy` e `findOneByCpf` continuam consumindo `saoPedroContatoService` e `fetchExternalContatos`. Nenhuma alteração de injeção de dependência, construtor ou assinatura de método privado é necessária.

### 3. Testes focados na regressão da listagem

`pessoa.service.spec.ts` ganha cobertura explícita de `findAll`: a resposta não inclui `contatos` **e** `findExternalContatos` **não é chamado**. Os testes existentes de `findOneByCpf` (contatos presentes / vazio em falha) permanecem como guarda de que as leituras individuais continuam intactas. Nenhum e2e atual (test/pessoa) assere `contatos` na listagem — verificação de que continua verdadeiro entra como task de verificação, sem novo cenário e2e obrigatório.

## Risks / Trade-offs

- **Consumidores do frontend podem ler `contatos` na listagem** → A listagem deixa de trazer a chave; verificar os consumidores do `GET /pessoa` antes do deploy e comunicar a quebra de contrato (a alteration está **BREAKING** no proposal). Como mitigação, a leitura individual continua disponível para obter contatos quando necessário.
- **Resposta da listagem muda de shape (`contatos` some)** → Mudança pequena e localizada; rollback é re-adicionar o bloco removido em `findAll` (diff mínimo, reversível).
- **Esquecer de atualizar o teste de `findAll`** → Task dedicada exige asserção negativa (`toHaveBeenCalledTimes(0)` em `findExternalContatos` e ausência do campo), cobrindo a regressão.

## Migration Plan

Deploy único da mudança de código + testes. Sem migração de dados (contatos seguem na São Pedro). Documentar a remoção do campo na resposta de `GET /pessoa` como mudança de contrato de API. Rollback: reverter o commit (bloco pequeno e isolado).
