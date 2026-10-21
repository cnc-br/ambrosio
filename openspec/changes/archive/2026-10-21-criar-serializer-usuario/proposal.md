# Proposal

## Why

`GET /users/:id` hoje retorna o registro cru do Prisma (`user`), expondo o hash de `password` e campos internos na resposta, sem um contrato definido. O projeto já padroniza essa composição para pessoa (`pessoa.serializer.ts` retorna o domínio `Pessoa`); o usuário precisa do mesmo tratamento, retornando um objeto `User` de domínio com os dados da pessoa vinculada e as paróquias sob sua responsabilidade.

## What Changes

- Criar `src/users/user.serializer.ts` (mesmo padrão de `src/pessoa/pessoa.serializer.ts`): funções puras que montam o objeto `User` a partir do registro cru do Prisma.
- `UsersService.findOne` passa a compor a resposta via serializer usando `pessoaService.findOne(user.pessoaId)` quando o usuário tem pessoa vinculada, e devolve `Promise<User>`.
  - **BREAKING**: a resposta de `GET /users/:id` deixa de conter `password` (e demais campos sensíveis); o contrato passa a ser a interface `User`.
- Nova interface `User` passa a vir de `neocatecumenal` (novo release do pacote), com `pessoa?: Pessoa` e `paroquias: Paroquia[]` — dependência externa a ser atualizada.
- **BREAKING interno**: `auth.service.changePassword` hoje lê `user.password` e `user.active` do retorno de `findOne`; passa a buscar o registro com hash por um método dedicado, sem mudar o comportamento observável do fluxo de troca de senha.
- Escopo mantém `create`, `findAll` e `findOneByEmail` como estão (continuam expondo o cru) — a mudança atinge apenas o detalhe por id.

## Capabilities

### New Capabilities
- `serializacao-usuario`: contrato de resposta do recurso User na API — campos expostos no detalhe, composição com a pessoa vinculada (via `pessoa.service`) e paróquias do usuário, e exclusão de dados sensíveis.

### Modified Capabilities
- Nenhuma.

## Impact

- Código: novo `src/users/user.serializer.ts`; alteração em `src/users/users.service.ts` (`findOne`) e `src/auth/auth.service.ts` (`changePassword`); novo select de paróquia para preencher `Paroquia` (padrão `PAROQUIA_SELECT`).
- Dependência: `neocatecumenal` — precisa de release que exporte a interface `User` (mesmo padrão de export do `Pessoa`); `package.json`/lockfile atualizados.
- API: contrato de `GET /users/:id` (resource `users`); fluxos de auth (login/troca de senha) sem mudança observável.
- Testes: unitário de `UsersService` (findOne serializado) e manutenção do e2e de auth/troca de senha; sem e2e atual de 200 em `GET /users/:id`.
- Fora do escopo: exposição de `password` em `create`/`findAll` (comportamento atual mantido).