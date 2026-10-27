# Tasks

## 1. Mapper de resposta de contato (snake_case → camelCase)

- [x] 1.1 Criar `src/external/sao-pedro/mapper/contato-response.mapper.ts` com `toDomain(external)` e `toDomainList(external[])`, mapeando explicitamente `pessoa_id → pessoaId`, `tipo_telefone → tipoTelefone`, `contato_principal → contatoPrincipal` (além de `id`, `telefone`, `email`, `observacao`), preservando `null` e omitindo campos ausentes — verificar com o novo teste `contato-response.mapper.spec.ts` (todos os campos, campos nulos preservados, campos ausentes omitidos).

## 2. Aplicação na fronteira externa e alinhamento dos testes

- [x] 2.1 Aplicar o mapper em `SaoPedroContatoService.findExternalContatos` (normalizar a lista extraída do envelope) e em `createExternalContato` (normalizar `response.data`) — verificar que `npm run build` compila e que o serviço passa a devolver `PessoaContato`/`PessoaContato[]` em camelCase.
- [x] 2.2 Atualizar `src/external/sao-pedro/sao-pedro-contato.service.spec.ts`: `findExternalContatos` passa a mockar resposta HTTP em snake_case (`pessoa_id`, `tipo_telefone`, `contato_principal`) e a asserir retorno em camelCase; `createExternalContato` passa a asserir payload enviado à São Pedro em snake_case (`tipo_telefone`, `contato_principal`) e resposta normalizada em camelCase — verificar que `npx vitest run src/external/sao-pedro/sao-pedro-contato.service.spec.ts` passa.
- [x] 2.3 Atualizar `src/external/sao-pedro/mapper/create-contato.mapper.spec.ts` para esperar payload em snake_case (`tipo_telefone`, `contato_principal`), alinhando título e asserções à mudança de envio já feita no `CreateContatoMapper` — verificar que `npx vitest run src/external/sao-pedro/mapper` passa.

## 3. Verificação de integração

- [x] 3.1 Executar `npx vitest run src/external src/pessoa` e `npm run lint` e `npm run build` sem erros.
- [x] 3.2 Executar a suíte e2e de `pessoa` (`vitest run --config ./vitest.config.e2e.ts test/pessoa`) e confirmar que os casos de criação de contato seguem verdes (os mocks substituem o serviço, onde mora a normalização) e que nenhum cenário assere contatos em snake_case.

## Workflow follow-up

- Revisar os artefatos de planejamento e arquivar a change após a revisão.
- Na arquivagem, sincronizar na ordem as duas changes que tocam `pessoa-contato` (`remover-contatos-da-listagem-pessoa` e esta), já que alteram requisitos distintos da mesma capacidade.
