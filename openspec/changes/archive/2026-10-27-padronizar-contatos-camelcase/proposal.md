# Proposal

## Why

A API São Pedro troca contatos em snake_case (`pessoa_id`, `tipo_telefone`, `contato_principal`), mas o contrato da API ambrosio (interface `PessoaContato` da lib `neocatecumenal`) é camelCase (`pessoaId`, `tipoTelefone`, `contatoPrincipal`). Hoje `SaoPedroContatoService.findExternalContatos` e `createExternalContato` repassam o payload cru da São Pedro, então o cliente recebe a chave `contatos` em snake_case nos GETs de pessoa e o contato criado em snake_case no `POST /pessoa/:id/contato` — ferindo a interface. O envio (request) já foi corrigido para snake_case na criação; falta normalizar a **resposta** para camelCase.

## What Changes

- Novo mapper de resposta de contato (`snake_case → camelCase`), mapeando explicitamente `pessoa_id → pessoaId`, `tipo_telefone → tipoTelefone`, `contato_principal → contatoPrincipal` (e `id`, `telefone`, `email`, `observacao`), preservando valores nulos/omitidos.
- `SaoPedroContatoService.findExternalContatos` passa a retornar `PessoaContato[]` de fato em camelCase — os GETs de pessoa (`/pessoa/:id`, `/pessoa?cpf=`, `/pessoa?externalId=`) passam a entregar a chave `contatos` em camelCase.
- `SaoPedroContatoService.createExternalContato` também normaliza a resposta, então o `POST /pessoa/:id/contato` devolve o contato criado em camelCase.
- O envio à São Pedro permanece em snake_case (mapper `CreateContatoMapper` já ajustado).
- Atualizar testes que assumiam camelCase na fronteira externa (payload enviado e resposta lida) e adicionar teste unitário do novo mapper.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova. -->

### Modified Capabilities
- `pessoa-contato`: novo requisito — as respostas da API ambrosio expõem os contatos em camelCase conforme a interface `PessoaContato`, tanto nas leituras individuais quanto na criação de contato, independentemente do formato snake_case usado internamente pela São Pedro.

## Impact

- `src/external/sao-pedro/mapper/contato-response.mapper.ts` — **novo** mapper `toDomain`/`toDomainList` (snake → camel).
- `src/external/sao-pedro/sao-pedro-contato.service.ts` — aplicação do mapper em `findExternalContatos` e `createExternalContato`.
- Testes — novo `contato-response.mapper.spec.ts`; `sao-pedro-contato.service.spec.ts` (payload enviado em snake_case e resposta recebida em snake_case → retorno camelCase); `create-contato.mapper.spec.ts` (expectativas snake_case alinhadas à mudança de envio já feita na working tree).
- Sem mudança em `pessoa.serializer.ts`, `pessoa.service.ts` nem nos mocks e2e (que substituem o serviço e já ficam aquém da normalização).

### Não faz parte deste escopo
- Normalizar outros recursos da São Pedro (ex.: resposta de pessoa) — a pessoa já chega em camelCase.
- Alterar o formato de envio (`CreateContatoMapper`) — já em snake_case, fora do escopo.
- Migração de dados ou mudanças no frontend.
