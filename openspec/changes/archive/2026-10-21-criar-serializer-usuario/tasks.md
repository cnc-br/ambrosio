# Tasks

## 1. Dependência externa (neocatecumenal)

- [x] 1.1 Atualizar `neocatecumenal` no `package.json` para o release que exporta a interface `User` e executar `npm install`; verificar que `import { User } from 'neocatecumenal'` resolve no TS (o barrel do pacote exporta `User` nomeado, como faz com `Pessoa`)
- [x] 1.2 Conferir que `npm run build` compila com a interface `User` instalada; se o release ainda não existir, registrar isso como bloqueio explícito para a equipe

## 2. Select de paróquia e serializer

- [x] 2.1 Criar `PAROQUIA_BASICA_SELECT` em `src/prisma/selects/paroquia.select.ts` reutilizando `ENDERECO_SELECT` e `DIOCESE_SELECT`, com `setor` incluindo `regiao.macroRegiao` e sem `comunidades`/`observacao`; verificar que o JSON do select satisfaz a interface `Paroquia` (id, descricao, diocese, endereco, setor.regiao.macroRegiao)
- [x] 2.2 Criar `src/users/user.serializer.ts` com `serializeUserResponse(rawUser, pessoa?)` no padrão do `serializePessoaResponse`; verificar unit test que monta `User` com os campos do contrato, omite `password`/`resetPasswordToken`/`resetPasswordExpires`, mapeia `whatsapp` nulo para `''` e `pessoaId` nulo para `undefined`
- [x] 2.3 Cobrir no unit test do serializer os casos de `paroquias` populadas e vazias (lista vazia quando usuário não tem vínculos); verificar que o teste passa

## 3. findOne serializado no UsersService

- [x] 3.1 Alterar `UsersService.findOne` para incluir `usuarioParoquias.paroquia.select: PAROQUIA_BASICA_SELECT`, compor `pessoa` via `pessoaService.findOne(user.pessoaId)` quando `pessoaId` existir e retornar `serializeUserResponse(user, pessoa)`; verificar que o retorno é tipado como `Promise<User>` e não contém `password`
- [x] 3.2 Atualizar `users.service.spec.ts` com mocks do `PessoaService`: usuário com `pessoaId` chama `pessoaService.findOne` e inclui `pessoa` na resposta; usuário sem `pessoaId` não chama `pessoaService` e omite `pessoa`; verificar que os testes passam

## 4. Fluxo de auth preservado

- [x] 4.1 Adicionar `UsersService.findByIdWithPassword(id)` que retorna o registro cru com `password` e `active`; verificar unit test que o método devolve o hash sem passar pelo serializer
- [x] 4.2 Ajustar `auth.service.changePassword` para usar `findByIdWithPassword` em vez de `findOne`; verificar unit tests dos cenários de senha atual correta (sucesso) e incorreta (401), e que `npm run test:e2e` mantém verdes os fluxos de login e troca de senha

## 5. Verificação integrada

- [x] 5.1 Executar `npm run lint`, `npm run build`, `npm run test` e `npm run test:e2e`; verificar que tudo passa, incluindo os cenários novos de `GET /users/:id` e os fluxos existentes de auth
- [x] 5.2 Adicionar cenário e2e de `GET /users/:id` autenticado verificando o contrato `User` (presença de `pessoa` quando vinculada, `paroquias`, ausência de `password`); verificar que o cenário passa

## Workflow follow-up

- Archive a change depois que a revisão do projeto for concluída.
- Verificar o resultado do archive.