# Proposal

## Why

Com a migração para a São Pedro, os contatos deixaram de ser persistidos localmente (`pessoaContato` foi removida). Contudo, os GETs de pessoa (`GET /pessoa`, `GET /pessoa/:id` e `GET /pessoa?cpf=`) ainda não devolvem os contatos, quebrando o frontend que hoje lê contatos junto com os endereços. Os contatos precisam voltar na leitura de pessoa — buscados da São Pedro, no mesmo nível que os `enderecos` já vêm do banco local.

## What Changes

- `SaoPedroContatoService` ganha `findExternalContatos(pessoaUuid): Promise<PessoaContato[]>` chamando `GET /api/pessoas/{uuid}/contatos/` (mesmo padrão de autenticação/retry já usado).
- `serializePessoaResponse` passa a aceitar e retornar `contatos` (campo `contatos` da interface `Pessoa` da lib `neocatecumenal`), espelhando o comportamento de `enderecos`.
- `PessoaService.findAll` busca os contatos das pessoas da página em paralelo e inclui na resposta; falha de um contato isolado não derruba a listagem (retorna `[]` para a pessoa afetada).
- `PessoaService.findBy` (usado por `GET /pessoa/:id` e `findByExternalId`) e `PessoaService.findOneByCpf` também incluem os contatos na resposta.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova. -->

### Modified Capabilities
- `pessoa-contato`: novo requisito — os contatos passam a ser retornados nos GETs de pessoa (listagem, por id e por cpf), obtidos da São Pedro, com a listagem tolerante a falha individual.

## Impact

- `src/external/sao-pedro/sao-pedro-contato.service.ts` — novo método `findExternalContatos`.
- `src/pessoa/pessoa.serializer.ts` — retorno de `contatos` no `serializePessoaResponse`.
- `src/pessoa/pessoa.service.ts` — injeção do `SaoPedroContatoService` e inclusão dos contatos em `findAll`, `findBy` e `findOneByCpf`.
- Testes — `sao-pedro-contato.service.spec.ts`, novo `pessoa.serializer.spec.ts`, `pessoa.service.spec.ts` (injeção do novo provider) e mock `test/mocks/sao-pedro-api-mock.ts` (`findExternalContatos`).

### Não faz parte deste escopo
- Alterações no corpo do contato (não há PATCH/DELETE de contato).
- Paginação ou endpoint dedicado de contatos.