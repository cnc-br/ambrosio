# Proposal

## Why

A tabela `pessoaContato` já existe no schema Prisma (com relação `onDelete: Cascade` para `pessoa`), mas não há nenhuma rota que permita salvar os contatos de uma pessoa — o controller `PessoaController` expõe criação, listagem, busca e atualização de pessoas, e a sub-rota de casal, mas nenhuma operação sobre `contatos`. Sem a rota, os dados de contato coletados no cadastro não podem ser persistidos pela API.

## What Changes

- Adiciona a rota `POST /pessoa/:id/contato` no `PessoaController`, protegida pelos guards `AuthGuard` e `RoleGuard` já aplicados à classe, criando um contato para a pessoa com o id informado.
- Cria o DTO `CreatePessoaContatoDto` em `src/pessoa/dto/create-pessoa-contato.dto.ts` com os campos do modelo `pessoaContato`: `telefoneResidencial`, `telefoneCelular`, `observacao`, `ativo`, `email` e `contatoPrincipal`, validados com `class-validator` (mesmo padrão dos DTOs existentes).
- Cria um serviço de contato (`ContatoService`) seguindo o padrão do `CasalService` (sub-recurso já existente), com validação de permissão via `validateCreateAbility('pessoa')`.
- Aplica a regra de contato principal: no máximo **um** contato da pessoa pode ter `contatoPrincipal: true`. Ao salvar um contato com `contatoPrincipal: true`, os demais contatos da pessoa são rebaixados para `false` na mesma transação; se o campo não for informado, o contato é salvo como `false`.
- Verifica a existência da pessoa (`findUniqueOrThrow`) antes de criar o contato, retornando 404 quando a pessoa não existe.
- Adiciona testes de serviço e e2e para a nova rota, cobrindo 401, 403, 404, 400 e o caminho de sucesso (201), seguindo a spec `testes-e2e`.

## Capabilities

### New Capabilities
- `pessoa-contato`: Gestão de contatos de uma pessoa — cobre a criação de um contato (`telefoneResidencial`, `telefoneCelular`, `email`, `observacao`, `ativo`, `contatoPrincipal`) vinculado a uma pessoa, incluindo a regra de no máximo um contato principal por pessoa, a validação de permissão e os erros de pessoa inexistente.

### Modified Capabilities
<!-- Nenhuma capacidade existente tem requisitos alterados: a spec `testes-e2e` já exige cobertura de 401/403/404/400 e caminhos de sucesso para todo controller exposto, e a nova suíte apenas segue esse padrão. -->

## Impact

- `src/pessoa/pessoa.controller.ts` — novo endpoint `POST /pessoa/:id/contato` com anotações Swagger (`ApiCreatedResponse`, `ApiNotFoundResponse`, `ApiBody`).
- `src/pessoa/dto/create-pessoa-contato.dto.ts` — novo DTO de criação de contato.
- `src/pessoa/contato/contato.service.ts` — novo serviço de contato (padrão `CasalService`), com validação de permissão e lógica do contato principal em transação.
- `src/pessoa/pessoa.module.ts` — registro do `ContatoService` nos providers.
- `src/pessoa/contato/contato.service.spec.ts` — testes unitários do serviço.
- `test/pessoa/pessoa-contato.e2e-spec.ts` — testes e2e da nova rota.
- `prisma/schema.prisma` — **sem alterações**: o modelo `pessoaContato` e a relação com `pessoa` já existem.
- Permissões CASL: a rota reutiliza a permissão `create` sobre o recurso `pessoa` (o recurso `pessoaContato` não existe em `PermissionResource`); nenhuma mudança em regras de autorização.

### Não faz parte deste escopo
- Rotas de listagem (`GET /pessoa/:id/contato`), atualização (`PATCH`) ou exclusão (`DELETE`) de contatos.
- Aceitar múltiplos contatos por requisição (array).
- `onDelete: Cascade` já existe na relação `pessoaContato.pessoa` — sem mudança de schema nem migração.