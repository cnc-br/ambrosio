# Tasks

## 1. DTO de criação de contato

- [x] 1.1 Criar `src/pessoa/dto/create-pessoa-contato.dto.ts` com a classe `CreatePessoaContatoDto` contendo `telefoneResidencial`, `telefoneCelular` e `observacao` com `@IsOptional()` + `@IsString()`, `email` com `@IsOptional()` + `@IsEmail()`, e `ativo`/`contatoPrincipal` com `@IsOptional()` + `@IsBoolean()` — verificar que `npm run build` compila e que nenhum campo é obrigatório (todos opcionais, seguindo os defaults do modelo Prisma)

## 2. Serviço de contato

- [x] 2.1 Criar `src/pessoa/contato/contato.service.ts` com `ContatoService @Injectable()` estendendo `BaseService`, injetando `PrismaService` e chamando `this.validateCreateAbility('pessoa')` no início do método `create(pessoaId: number, dto: CreatePessoaContatoDto)` — verificar que a classe compila e que o valide de permissão é invocado no fluxo
- [x] 2.2 Implementar `create` dentro de `this.prisma.$transaction(async (tx) => ...)`: `tx.pessoa.findUniqueOrThrow({ where: { id: pessoaId } })`, e quando `dto.contatoPrincipal === true` executar `tx.pessoaContato.updateMany({ where: { pessoaId, contatoPrincipal: true }, data: { contatoPrincipal: false } })`, retornando `tx.pessoaContato.create({ data: { pessoaId, ...dto } })` — verificar que pessoa inexistente propaga P2025 (404 pelo `PrismaExceptionsFilter`) sem criar contato e que o swap e a criação ocorrem na mesma transação
- [x] 2.3 Criar `src/pessoa/contato/contato.service.spec.ts` com mocks do `PrismaService`/`CaslAbilityService` cobrindo: permissão negada lança `ForbiddenException`; criação sem `contatoPrincipal` **não** chama `updateMany` e cria com `pessoaId`; criação com `contatoPrincipal: true` chama `updateMany` antes do `create`; pessoa inexistente (P2025) propaga erro — verificar que `npm test -- contato.service` passa

## 3. Controller e módulo

- [x] 3.1 Adicionar no `PessoaController` a rota `@Post('/:id/contato')` com `@Param('id') id: string`, `@Body() createPessoaContatoDto: CreatePessoaContatoDto` delegando a `contatoService.create(+id, createPessoaContatoDto)` e os decoradores Swagger `ApiCreatedResponse`, `ApiBadRequestResponse`, `ApiNotFoundResponse` e `ApiBody` com exemplo — verificar que a rota responde 201 via e2e (tarefa 4) e que o Swagger documenta corpo/exemplos
- [x] 3.2 Registrar `ContatoService` nos `providers` de `src/pessoa/pessoa.module.ts` e atualizar `src/pessoa/pessoa.controller.spec.ts` (mock do `ContatoService` no provider, como feito para `CasalService`, e caso que verifica a delegação da nova rota) — verificar que `npm test -- pessoa.controller` passa

## 4. Testes e2e da rota

- [x] 4.1 Criar `test/pessoa/pessoa-contato.e2e-spec.ts` seguindo a spec `testes-e2e` (título `/<rota> (MÉTODO) - <status> | <descrição>`, setup padronizado com login admin e `principal`), mockando `SaoPedroPessoaService` e criando uma pessoa via `POST /pessoa` como fixture — verificar que a suíte inicializa com sucesso
- [x] 4.2 Cobrir os casos de erro no e2e: 401 sem token; 403 para usuário autenticado sem permissão (`Você não tem permissão para create pessoa`); 404 para `POST /pessoa/999999/contato` em pessoa inexistente (`O registro de 'Pessoa' não foi encontrado.`); 400 para payload inválido (ex.: `email` inválido e `contatoPrincipal` com tipo errado) — verificar que `npm run test:e2e -- pessoa-contato` passa nesses casos
- [x] 4.3 Cobrir os caminhos de sucesso no e2e: 201 criando contato com todos os campos e conferindo `pessoaId`/valores retornados; 201 de contato apenas com campos opcionais resultando em `ativo: true` e `contatoPrincipal: false`; 201 com `contatoPrincipal: true` rebaixando o contato principal anterior para `false` (swap, restando apenas um principal) — verificar que `npm run test:e2e -- pessoa-contato` passa nesses casos

## 5. Verificação final

- [x] 5.1 Executar `npm run lint` e `npm run build` sem erros
- [x] 5.2 Executar a suíte de testes (unit + e2e) do módulo `pessoa` por completo e confirmar que todos os casos passam