# Design

## Context

O `CarismaService.addCarismaToPessoa` já sincroniza os carismas de uma pessoa: remove os que não constam na lista recebida e adiciona os novos. Ele valida apenas se a pessoa existe (`pessoaService.findOne`), sem verificar o escopo de paróquia do usuário. O `PessoaService` já expõe `validarPessoaDentroDoEscopoDeAtualizacao(id)`, que reutiliza o `update` de `pessoa` via `accessibleBy` e distingue 404 (inexistente) de 403 (fora do escopo). O `PessoaService` já está injetado no `CarismaService`.

## Goals / Non-Goals

**Goals:**

- Restringir `POST /carismas/pessoa/:pessoaId` ao escopo de paróquia do usuário antes de qualquer escrita.
- Manter `ADMIN` irrestrito e permitir pessoa sem vínculo ativo.
- Reutilizar a mesma regra de escopo usada em `pessoa`, `casal` e `contato`.

**Non-Goals:**

- Não alterar o schema de banco.
- Não alterar o comportamento de `GET /carismas` nem `GET /carismas/equipe`.
- Não alterar o contrato de resposta do `POST /carismas/pessoa/:pessoaId`.

## Decisions

**1. Reutilizar `PessoaService.validarPessoaDentroDoEscopoDeAtualizacao` no `CarismaService`.**

- Alternativa considerada: criar uma validação própria no `CarismaService`. Rejeitada porque duplicaria a regra de escopo e divergiria da regra de `pessoa`.
- A validação usa `accessibleBy('update', 'pessoa')`, que já cobre o `ADMIN` (irrestrito) e o `SECRETARIA_CNC` (escopo por paróquia).

**2. Validar antes de qualquer escrita.**

- `addCarismaToPessoa` remove carismas antes de adicionar os novos. A validação deve ocorrer antes do `removeCarismaFromPessoa`, para que uma pessoa fora do escopo não tenha carismas removidos.
- Substituir a chamada `pessoaService.findOne(pessoaId)` por `pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(pessoaId)` mantém a checagem de existência e adiciona o escopo.

**3. Chamar `validateUpdateAbility('pessoa')` antes do escopo.**

- Segue o padrão de `PessoaService.update`: primeiro a permissão de `update`, depois o escopo. Perfis sem permissão de `update` recebem 403 com a mensagem padrão.

**4. Documentar 403/404 no Swagger.**

- Adicionar `@ApiForbiddenResponse` e `@ApiNotFoundResponse` ao endpoint `POST /carismas/pessoa/:pessoaId`.

## Risks / Trade-offs

- [Risco] `CATEQUISTA_*` e demais perfis com `read` de `pessoa` mas sem `update` passam a receber 403. → Mitigação: comportamento esperado; a rota é de escrita.
- [Risco] `PessoaService` é request-scoped; `CarismaService` também é. → Mitigação: o padrão já é usado em `casal` e `contato`.
- [Risco] A rota informada pelo usuário (`/carismas/pessoas/{id}`) difere da rota real (`/carismas/pessoa/:pessoaId`). → Mitigação: a mudança aplica-se à rota real; o contrato não é renomeado.
