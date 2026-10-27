# Tasks

## 1. Busca externa de contatos

- [x] 1.1 Implementar `findExternalContatos(pessoaUuid: string): Promise<PessoaContato[]>` em `src/external/sao-pedro/sao-pedro-contato.service.ts` chamando `GET ${SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/` via `authService.executeAuthenticatedRequest` e retornando `response.data?.data ?? response.data ?? []` — verificar com teste unitário no `sao-pedro-contato.service.spec.ts` (GET com envelope `data` e com array direto)

## 2. Serialização dos contatos

- [x] 2.1 Adicionar `contatos?: PessoaContato[]` e incluí-lo na resposta em `src/pessoa/pessoa.serializer.ts` (espelhando `enderecos`) — verificar com o novo teste `src/pessoa/pessoa.serializer.spec.ts` (contatos presentes quando informado e `undefined` quando não)

## 3. Integração no `PessoaService`

- [x] 3.1 Injetar `SaoPedroContatoService` em `src/pessoa/pessoa.service.ts` — verificar que `npm run build` compila
- [x] 3.2 Incluir os contatos em `findAll` (busca paralela por página com `Promise.all`, falha individual → `[]` + warning) e passar `contatos` ao `serializePessoaResponse` — verificar com teste no `pessoa.service.spec.ts` (quando `findExternalContatos` resolve, a resposta inclui `contatos`; quando rejeita, retorna `[]`)
- [x] 3.3 Incluir os contatos em `findBy` e `findOneByCpf` (mesmo tratamento tolerante) — verificar que o teste de `findOneByCpf` do `pessoa.service.spec.ts` cobre `contatos` na resposta
- [x] 3.4 Atualizar `src/pessoa/pessoa.service.spec.ts` com o provider mock de `SaoPedroContatoService` (e métodos reais no mock de `SaoPedroPessoaService` usados nos testes) e `test/mocks/sao-pedro-api-mock.ts` com `findExternalContatos` — verificar que `npx vitest run src/external src/pessoa` passa

## 4. Verificação final

- [x] 4.1 Executar `npm run lint` e `npm run build` sem erros
- [x] 4.2 Executar a suíte e2e de `pessoa` (`vitest run --config ./vitest.config.e2e.ts test/pessoa`) e confirmar que todos os casos passam