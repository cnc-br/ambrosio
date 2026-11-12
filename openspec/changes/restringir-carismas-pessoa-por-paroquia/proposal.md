# Proposal

## Why

O endpoint `POST /carismas/pessoa/:pessoaId` (rota informada como `/carismas/pessoas/{id}`) adiciona e remove carismas de uma pessoa sem validar o escopo de paróquia do usuário. Hoje qualquer usuário autenticado com permissão de leitura pode alterar carismas de pessoas de qualquer paróquia, o que viola o princípio de que cada `SECRETARIA_CNC` cuida apenas da sua paróquia.

## What Changes

- `POST /carismas/pessoa/:pessoaId` passa a validar o escopo de paróquia da pessoa antes de adicionar ou remover carismas.
- `SECRETARIA_CNC` só pode alterar carismas de pessoas com vínculo ativo em uma de suas paróquias, ou sem vínculo ativo.
- Pessoa fora do escopo recebe 403; pessoa inexistente recebe 404.
- `ADMIN` mantém a operação irrestrita.
- A validação é aplicada antes de qualquer escrita, evitando remoções parciais.
- Nenhum schema de banco muda.

## Capabilities

### New Capabilities

- `carisma`: escopo de paróquia para adicionar/remover carismas de uma pessoa.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisito alterado. -->

## Impact

- `src/carisma/carisma.service.ts` (validação no `addCarismaToPessoa`).
- `src/carisma/carisma.controller.ts` (documentação Swagger de 403/404).
- Testes unitários de `CarismaService` e teste e2e de escopo.
- Reutiliza `PessoaService.validarPessoaDentroDoEscopoDeAtualizacao`, já existente.
