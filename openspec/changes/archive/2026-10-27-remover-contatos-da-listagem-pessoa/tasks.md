# Tasks

## 1. Remoção da busca de contatos na listagem

- [x] 1.1 Em `src/pessoa/pessoa.service.ts`, remover de `findAll` o bloco `contatosMap` + `Promise.all` (busca paralela de contatos por pessoa) e deixar de passar o 4º argumento (`contatos`) ao `serializePessoaResponse` na listagem — verificar que `findAll` não referencia mais `contatosMap`/`fetchExternalContatos`, que `findBy` e `findOneByCpf` continuam passando `contatos`, e que `npm run build` compila. O campo `contatos` deixa de aparecer nos itens de `GET /pessoa`.
- [x] 1.2 Confirmar que `SaoPedroContatoService` e `fetchExternalContatos` permanecem intactos e em uso apenas por `findBy` e `findOneByCpf` — verificar por grep que `fetchExternalContatos(` só aparece nesses dois métodos e que o import de `PessoaContato` continua necessário (tipo de retorno de `fetchExternalContatos`).

## 2. Testes

- [x] 2.1 Adicionar em `src/pessoa/pessoa.service.spec.ts` teste de `findAll`: quando o mock da São Pedro retorna pessoas, a resposta não inclui `contatos` **e** `saoPedroContatoServiceMock.findExternalContatos` não é chamado (`toHaveBeenCalledTimes(0)`) — verificar que `npx vitest run src/pessoa/pessoa.service.spec.ts` passa.
- [x] 2.2 Manter os testes existentes de `findOneByCpf` (contatos incluídos e `[]` em falha) como guarda das leituras individuais — verificar que continuam passando sem alteração após a mudança de `findAll`.

## 3. Verificação de integração

- [x] 3.1 Confirmar que nenhum teste e2e em `test/` assere `contatos` na listagem `GET /pessoa` (grep por `contatos` em `test/pessoa/`) — se algum asserir, atualizá-lo para refletir a listagem sem o campo.
- [x] 3.2 Executar a suíte de unidade das áreas afetadas (`npx vitest run src/external src/pessoa`) e `npm run lint` e `npm run build` sem erros.
- [x] 3.3 Executar a suíte e2e de `pessoa` (`vitest run --config ./vitest.config.e2e.ts test/pessoa`) e confirmar que todos os casos passam.

## Workflow follow-up

- Revisar os artefatos de planejamento e arquivar a change após a revisão.
- Comunicar a mudança de contrato da API (`GET /pessoa` sem `contatos`) aos consumidores do frontend.
