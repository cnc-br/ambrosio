# Proposal

## Why

Os contatos de uma pessoa hoje são persistidos na tabela local `pessoaContato`, enquanto a pessoa em si já é registrada na API externa São Pedro (`externalId` na tabela `pessoa`). Isso divide a fonte de verdade: a São Pedro possui um modelo `Contato` (com `tipo_telefone`, `telefone`, `email`, `observacao`, `contato_principal`) que deve receber esses dados. Remover a tabela local e encaminhar a criação de contato para a São Pedro elimina a duplicação de dados e centraliza a gestão de contatos no sistema que já detém a pessoa.

## What Changes

- **BREAKING** — Remove o modelo `pessoaContato` de `prisma/schema.prisma` (e a relação `contatos` em `pessoa`) e adiciona uma migração Prisma que descarta a tabela `pessoaContato`.
- **BREAKING** — Altera o payload de `POST /pessoa/:id/contato`: substitui `telefoneResidencial` e `telefoneCelular` pelos campos `tipoTelefone` (enum `CELULAR` | `RESIDENCIAL` | `COMERCIAL`) e `telefone`, e remove `ativo`. Permanecem `email`, `observacao` e `contatoPrincipal`. Todos os campos continuam opcionais (`class-validator`, mesmo padrão dos DTOs existentes).
- Cria um serviço em `src/external/sao-pedro` (`SaoPedroContatoService`) que envia o contato para `POST /api/pessoas/{uuid}/contatos/` (com o `uuid` = `externalId` da pessoa local), usando o padrão de autenticação/retry de `SaoPedroPessoaService`; o payload segue o contrato camelCase da São Pedro (`tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal`) e o contato criado é tipado pela interface `PessoaContato` da lib `neocatecumenal`.
- O `ContatoService` (`src/pessoa/contato/`) passa a resolver a pessoa local pelo id (`404` quando não existe, mesmo comportamento atual), obter o `externalId` e delegar a criação ao `SaoPedroContatoService`, retornando o contato criado na resposta.
- A regra de "no máximo um contato principal por pessoa" passa a ser garantida pela São Pedro (que rebaixa o principal anterior ao receber `contato_principal=true`); o fluxo local deixa de executar o swap em transação.
- Quando `contatoPrincipal` não é informado, o campo não é enviado e a São Pedro aplica o default do modelo (`True`) — comportamento observável diferente do default local anterior (`false`).

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova: o comportamento de criação de contato já é coberto pela capacidade `pessoa-contato`, que é a única afetada. -->

### Modified Capabilities
- `pessoa-contato`: os requisitos de criação de contato mudam — novo payload (`tipoTelefone`/`telefone` no lugar de `telefoneResidencial`/`telefoneCelular`, remoção de `ativo`), persistência delegada à São Pedro (a API principal deixa de gravar no próprio banco), regra do contato principal único garantida pela São Pedro, default de `contatoPrincipal` ausente passa para `true`, e a resposta passa a ser o contato criado na São Pedro.

## Impact

- `prisma/schema.prisma` — remoção do modelo `pessoaContato` e da relação `contatos` de `pessoa`; nova migração para drop da tabela (`prisma/migrations/`).
- `src/pessoa/dto/create-pessoa-contato.dto.ts` — novos campos do DTO (`tipoTelefone`, `telefone`; remoção de `telefoneResidencial`, `telefoneCelular`, `ativo`).
- `src/pessoa/contato/contato.service.ts` — resolve a pessoa local e delega à São Pedro; remove a transação local e o swap do contato principal.
- `src/pessoa/pessoa.controller.ts` — exemplo do payload no Swagger (`ApiBody`) atualizado.
- `src/external/sao-pedro/` — novo `sao-pedro-contato.service.ts`, `dto/external-create-contato.dto.ts` e `mapper/create-contato.mapper.ts` (payload camelCase); a interface `PessoaContato` da lib `neocatecumenal` tipa o contato retornado; `SaoPedroModule` passa a exportar o novo serviço.
- Testes — reescrita de `src/pessoa/contato/contato.service.spec.ts`, atualização de `src/pessoa/pessoa.controller.spec.ts`, `test/pessoa/pessoa-contato.e2e-spec.ts` e mock `test/mocks/sao-pedro-api-mock.ts` (novo método de criação de contato).
- Permissões CASL: sem mudanças — a rota continua reutilizando `create` sobre o recurso `pessoa`.

### Não faz parte deste escopo
- Rotas de listagem (`GET /pessoa/:id/contato`), atualização (`PATCH`) ou exclusão (`DELETE`) de contatos.
- Criação em lote (array de contatos).
- Migração dos contatos existentes da tabela `pessoaContato` para a São Pedro (dados hoje locais não são transferidos por esta mudança).