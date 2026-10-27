# Proposal

## Why

`PessoaService.findAll` faz uma chamada externa à São Pedro para buscar os contatos de **cada** pessoa da página, em paralelo. Com listagens paginadas (default `limit` elevado), isso gera N chamadas HTTP externas por request e deixa o `GET /pessoa` lento para o frontend. A busca de contatos só deve acontecer na leitura de uma pessoa isolada, onde o custo é de uma chamada por request.

## What Changes

- **BREAKING (resposta da listagem)**: remover de `PessoaService.findAll` a busca paralela de contatos (`fetchExternalContatos`/`contatosMap`) e deixar de passar `contatos` ao `serializePessoaResponse`. Itens de `GET /pessoa` não incluem mais o campo `contatos` na resposta.
- Manter a busca de contatos em todas as leituras de detalhe de uma pessoa: `findBy` (usado por `findOne` por id e `findByExternalId`) e `findOneByCpf` — comportamento inalterado nessas rotas.
- Atualizar a especificação `pessoa-contato`: o requisito de inclusão de contatos passa a valer apenas para leituras individuais (`GET /pessoa/:id` e `GET /pessoa?cpf=`), e não mais para a listagem `GET /pessoa`.
- Ajustar testes que cobrem contatos na listagem (`pessoa.service.spec.ts`/e2e, se aplicável) para refletir a nova regra.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova. -->

### Modified Capabilities
- `pessoa-contato`: alterar o requisito "Contatos incluídos na leitura de pessoa" — os contatos passam a ser retornados **somente** nas leituras de detalhe (`GET /pessoa/:id` e `GET /pessoa?cpf=`), e não mais na listagem `GET /pessoa`; a listagem passa a não incluir o campo `contatos`.

## Impact

- `src/pessoa/pessoa.service.ts` — remoção da busca de contatos e do `contatosMap` em `findAll` (linhas ~94-111 e no `serializePessoaResponse` da listagem); nada muda em `findBy`, `findOneByCpf` nem `fetchExternalContatos`.
- `src/pessoa/pessoa.serializer.ts` — sem alteração de código (o campo `contatos` continua aceito e é omitido na resposta quando `undefined`).
- `src/pessoa/pessoa.service.spec.ts` — testes de `findAll`/providers e verificação de que a listagem não chama `findExternalContatos`.
- Testes e2e em `test/pessoa/` — verificar que nenhum cenário de listagem depende de `contatos`.
- Especificação `openspec/specs/pessoa-contato/spec.md` — delta no requisito de leitura.

### Não faz parte deste escopo
- Remover contatos das leituras individuais (`findOne`, `findByExternalId`, `findOneByCpf`) — a busca permanece nelas.
- Alterar o fluxo de criação de contato (`POST /pessoa/:id/contato`).
- Otimizar a própria chamada externa de contatos (cache, batching) — apenas a remoção da listagem.
