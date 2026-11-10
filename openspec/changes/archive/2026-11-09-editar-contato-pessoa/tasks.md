# Tasks

## 1. Atualização externa na São Pedro

- [x] 1.1 Criar `UpdatePessoaContatoDto` em `src/pessoa/dto/update-pessoa-contato.dto.ts` com os mesmos campos e validadores do `CreatePessoaContatoDto` (`tipoTelefone` enum CELULAR/RESIDENCIAL/COMERCIAL, `telefone` `@IsString` + `@MaxLength(20)`, `email` `@IsEmail`, `observacao`, `contatoPrincipal` `@IsBoolean`), todos `@IsOptional()`, e verificar que o arquivo compila e que as validações refletem o DTO de criação.
- [x] 1.2 Ampliar a assinatura de `CreateContatoMapper.toExternal` para aceitar `CreatePessoaContatoDto | UpdatePessoaContatoDto` (o shape do payload é o mesmo) e verificar que `src/external/sao-pedro/mapper/create-contato.mapper.spec.ts` continua passando.
- [x] 1.3 Implementar `updateExternalContato(contatoId, dto)` em `SaoPedroContatoService` — `PATCH ${SAO_PEDRO_API_URL}/api/contatos/${contatoId}/` via `executeAuthenticatedRequest`, payload via `CreateContatoMapper.toExternal`, resposta via `ContatoResponseMapper.toDomain` — e verificar que os novos casos de `src/external/sao-pedro/sao-pedro-contato.service.spec.ts` cobrem URL+contatoId, método PATCH, payload mapeado e resposta em camelCase.

## 2. ContatoService.update

- [x] 2.1 Implementar `update(pessoaId, contatoId, dto)` em `src/pessoa/contato/contato.service.ts` — `validateUpdateAbility('pessoa')`, `findUniqueOrThrow` valida a existência da pessoa e delegação a `updateExternalContato` — e verificar que os novos casos de `src/pessoa/contato/contato.service.spec.ts` passam: 403 sem permissão de `update pessoa`, delegação com `(contatoId, dto)` e propagação de P2025 (pessoa inexistente).

## 3. Rota de edição no PessoaController

- [x] 3.1 Adicionar no `PessoaController` o handler `update` com `@Patch(':id/contato/:contatoId')` (id da pessoa como `:id`, `:contatoId` = id do contato na São Pedro), com Swagger (`ApiOkResponse`, `ApiBadRequestResponse`, `ApiNotFoundResponse`, `ApiBody`), delegando a `contatoService.update(+id, contatoId, dto)`, e verificar que a URL resultante é `PATCH /pessoa/:id/contato/:contatoId` e que o `createContato` (`POST /pessoa/:id/contato`) permanece intacto.
- [x] 3.2 Adicionar em `src/pessoa/pessoa.controller.spec.ts` o caso de delegação de `update(1, 'id-contato-externo', dto)` ao `ContatoService` (mock do `contatoServiceMock.update`), e verificar que a suíte passa mantendo o caso existente do `createContato`.

## 4. Testes e2e e mock

- [x] 4.1 Adicionar `updateExternalContato: vi.fn()` a `test/mocks/sao-pedro-api-mock.ts` e verificar que a suíte e2e a utiliza nos casos do PATCH.
- [x] 4.2 Adicionar em `test/pessoa/pessoa-contato.e2e-spec.ts` os casos do PATCH seguindo a spec `testes-e2e`: 401 sem token, 403 (`Você não tem permissão para update pessoa`), 404 (pessoa inexistente, sem chamar a São Pedro), 400 (payload inválido), 200 com todos os campos, 200 parcial (apenas os campos enviados chegam ao mock) e propagação do 404 de contato externo quando o mock lança, e verificar que todos passam.

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run test` e verificar que toda a suíte unitária passa.
- [x] 5.2 Rodar `npm run test:e2e` e verificar que toda a suíte passa, incluindo os casos de criação existentes (`POST /pessoa/:id/contato`) que devem continuar verdes.

## Workflow follow-up

- Confirmar com a API São Pedro a forma exata do endpoint de atualização de contato (ver Open Questions no design.md) durante a implementação e ajustar URL/método de `updateExternalContato` se necessário, mantendo os cenários da spec.
- Após a implementação e revisão, arquivar a mudança e sincronizar o delta da spec `pessoa-contato` com a spec principal.