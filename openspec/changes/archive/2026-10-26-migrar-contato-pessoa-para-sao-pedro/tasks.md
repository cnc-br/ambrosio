# Tasks

## 1. Remoção da tabela `pessoaContato` no Prisma

- [x] 1.1 Remover o modelo `pessoaContato` e a relação `contatos` de `pessoa` em `prisma/schema.prisma` — verificar que `grep -rn "pessoaContato\|contatos" prisma/schema.prisma` não encontra referências ao modelo/relação
- [x] 1.2 Gerar a migração Prisma com `npx prisma migrate dev --name drop_pessoa_contato` (confirmar `DROP TABLE "pessoaContato"` no SQL gerado em `prisma/migrations/`) — verificar que a migração contém o drop e que `npx prisma migrate status` fica coerente
- [x] 1.3 Rodar `npm run generate` e `npm run build` — verificar que o cliente gerado e o build compilam sem referência a `pessoaContato`

## 2. Cliente externo da São Pedro para contato

- [x] 2.1 Mover `executeAuthenticatedRequest` de `SaoPedroPessoaService` para `SaoPedroAuthService` (como `executeAuthenticatedRequest<T>(requestFn, operation)`) e atualizar `SaoPedroPessoaService` para chamar `this.authService.executeAuthenticatedRequest(...)` — verificar que `npm run build` compila e que o comportamento de token/retry/erro permanece (sem alterar o corpo do método)
- [x] 2.2 Criar `src/external/sao-pedro/dto/external-create-contato.dto.ts` com os campos camelCase do payload (`tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal`, todos opcionais, `tipoTelefone` como enum da São Pedro) e `CreateContatoMapper.toExternal(dto)` em `src/external/sao-pedro/mapper/create-contato.mapper.ts` omitindo campos `undefined` — verificar com teste unitário do mapper (payload camelCase esperado pela São Pedro e omissão de `contatoPrincipal` ausente)
- [x] 2.3 Criar `src/external/sao-pedro/sao-pedro-contato.service.ts` com `SaoPedroContatoService` (`@Injectable`, herdando `BaseService`) injetando `HttpService` e `SaoPedroAuthService`, com `createExternalContato(pessoaUuid: string, dto: CreatePessoaContatoDto): Promise<PessoaContato>` (interface da lib `neocatecumenal`) fazendo `POST ${SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/` e retornando `response.data` tipado — verificar com teste unitário (mock de `HttpService`/`SaoPedroAuthService`) ou via e2e da tarefa 5
- [x] 2.4 Registrar `SaoPedroContatoService` em `providers`/`exports` do `SaoPedroModule` — verificar que `npm run build` compila e que o serviço é resolvível quando injetado (tarefa 4)

## 3. DTO e exemplos do payload de `POST /pessoa/:id/contato`

- [x] 3.1 Alterar `src/pessoa/dto/create-pessoa-contato.dto.ts`: substituir `telefoneResidencial`/`telefoneCelular` por `tipoTelefone` (`@IsOptional` + `@IsEnum` com `CELULAR | RESIDENCIAL | COMERCIAL`) e `telefone` (`@IsOptional` + `@IsString` + `@MaxLength(20)`), remover `ativo`, mantendo `email`, `observacao` e `contatoPrincipal` opcionais — verificar que `npm run build` compila e que payload inválido gera 400 (e2e da tarefa 5)
- [x] 3.2 Atualizar o exemplo do `@ApiBody` de `createContato` em `src/pessoa/pessoa.controller.ts` para os novos campos (`tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal`) — verificar que o Swagger (`/api`) documenta o novo payload

## 4. `ContatoService` delegando à São Pedro

- [x] 4.1 Reescrever `create` de `src/pessoa/contato/contato.service.ts`: manter `validateCreateAbility('pessoa')`, resolver `this.prisma.pessoa.findUniqueOrThrow({ where: { id: pessoaId }, select: { externalId: true } })` (404 para pessoa inexistente via `PrismaExceptionsFilter`) e delegar a `saoPedroContatoService.createExternalContato(pessoa.externalId, dto)`, removendo a transação local e o `updateMany` de swap — verificar que `npm run build` compila
- [x] 4.2 Reescrever `src/pessoa/contato/contato.service.spec.ts` com mocks de `PrismaService`/`SaoPedroContatoService`: permissão negada lança `ForbiddenException`; pessoa inexistente (P2025) propaga erro sem chamar o serviço externo; criação envia `externalId` da pessoa e retorna o contato criado — verificar que `npm test -- contato.service` passa
- [x] 4.3 Atualizar `src/pessoa/pessoa.controller.spec.ts` para o mock/`ContatoService` com a injeção de `SaoPedroContatoService` e a delegação da rota — verificar que `npm test -- pessoa.controller` passa

## 5. Mock e testes e2e

- [x] 5.1 Adicionar `createExternalContato` ao mock `test/mocks/sao-pedro-api-mock.ts` retornando um `PessoaContato` com os campos conhecidos — verificar que o mock é usado pelos testes e2e
- [x] 5.2 Atualizar `test/pessoa/pessoa-contato.e2e-spec.ts` para o novo payload (ex.: `tipoTelefone: 'CELULAR'`, `telefone`, `email`, `observacao`, `contatoPrincipal`) e para a resposta vinda do mock externo; remover asserções sobre `prisma.pessoaContato` e sobre `pessoaId`/`ativo` — verificar que `npm run test:e2e` da suíte `pessoa-contato` passa
- [x] 5.3 Ajustar os cenários e2e para o comportamento novo: 201 com o contato retornado pela São Pedro; 400 para `email` inválido e `tipoTelefone` com valor fora do enum; 404 para pessoa inexistente; 401/403 inalterados; caso do principal único com o mock simulando o rebaixamento (default `true` quando campo ausente) — verificar que `npm run test:e2e -- pessoa-contato` passa em todos os cenários

## 6. Verificação final

- [x] 6.1 Executar `npm run lint` e `npm run build` sem erros
- [x] 6.2 Executar a suíte completa (unit + e2e) do módulo `pessoa` e do `external` e confirmar que todos os casos passam