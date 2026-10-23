# Design

## Context

- `UsersService.remove(id)` (em `src/users/users.service.ts`) já existe: chama `this.validateDeleteAbility('user')` e devolve `this.prismaService.user.delete({ where: { id } })` — ou seja, retorna a linha crua (com `password`, `resetPasswordToken`, `resetPasswordExpires`). O controller já expõe `@Delete(':id')` (`DELETE /users/:id`). Motivação: ver `proposal.md - Why`.
- O `PaginationInterceptor` é global (`APP_INTERCEPTOR` em `src/app.module.ts`) e envolve toda resposta no envelope `{ server, total, page, limit, data }`.
- CASL (`src/casl/casl-ability/casl-ability.service.ts`): apenas `ADMIN` possui `manage all`; demais perfis não têm `delete` — na prática, apenas `ADMIN` consegue excluir usuário.
- Schema Prisma: a única FK externa apontando para `user` é `usuarioParoquia.userId`, que já declara `onDelete: Cascade`. A relação opcional `user.pessoaId → pessoa.id` vincula a conta à pessoa, sem cascade.
- `PrismaExceptionsFilter` mapeia `P2025` → 404 com `O registro de 'Usuário' não foi encontrado.` (`MODEL_NAME_MAP`).
- A suíte `test/users/user.e2e-spec.ts` sobrescreve `SaoPedroPessoaService` com um mock e já cobre GET/POST/auth; não há casos de DELETE.

## Goals / Non-Goals

**Goals:**
- Definir o contrato do `DELETE /users/:id`: exclusão física por id com `validateDeleteAbility('user')`, resposta `204 No Content` sem corpo.
- Não expor dados sensíveis do usuário excluído na resposta.
- Garantir (e comprovar em e2e) a remoção em cascata dos vínculos `usuarioParoquia` e a preservação da `pessoa` vinculada.
- Cobertura e2e do endpoint seguindo a spec `testes-e2e`.

**Non-Goals:**
- Excluir a `pessoa` vinculada ou qualquer dado além do usuário e seus `usuarioParoquia`.
- Alteração de schema Prisma ou migração (a cascata já existe).
- Regras como "não apagar o próprio usuário" ou "não apagar o último ADMIN".

## Decisions

### 1. `204 No Content` real, contornando o `PaginationInterceptor` global com `@Res()`

O controller usa a resposta crua do Nest para emitir o 204 vazio:

```ts
@Delete(':id')
async remove(@Param('id') id: string, @Res() res: Response) {
  await this.usersService.remove(id);
  res.status(HttpStatus.NO_CONTENT).end();
}
```

**Por quê:** um `204` não pode carregar corpo. Com `@Res()` cru, o Nest não serializa o retorno do handler e o valor mapeado pelo `PaginationInterceptor` é descartado — a resposta sai de fato vazia. Exceções lançadas antes do `res.status(204)` continuam sendo tratadas pelos filtros globais (`PrismaExceptionsFilter`, `SentryGlobalFilter`), preservando 401/403/404.

**Alternativa considerada:** `@HttpCode(204)` + handler sem retorno. Rejeitada: o `PaginationInterceptor` global continuaria emitindo o envelope `{ server, total, page, limit }` como corpo, violando a semântica de 204 sem corpo.

### 2. `UsersService.remove(id)` sem retorno de dados sensíveis

```ts
async remove(id: string) {
  this.validateDeleteAbility('user');
  await this.prismaService.user.delete({ where: { id } });
}
```

- Mantém `validateDeleteAbility('user')` → 403 (`Você não tem permissão para delete user`) para quem não tem permissão.
- `await ...delete` garante que `P2025` (usuário inexistente) suba ao `PrismaExceptionsFilter` → 404.
- O método não devolve nada: o corpo da resposta é responsabilidade exclusiva da rota (204 vazio).
- `usuarioParoquia` é removido em cascata pelo banco (`onDelete: Cascade`), sem lógica extra no service; a `pessoa` vinculada não é tocada.

**Alternativa considerada:** serializar e retornar o usuário excluído (como feito na paróquia). Rejeitada: o usuário confirmou o contrato 204 sem corpo, tornando desnecessário qualquer retorno.

### 3. Testes e2e em `test/users/user.e2e-spec.ts`

Novos casos seguindo `testes-e2e` (a suíte já usa o mock de `SaoPedroPessoaService`):
- `DELETE /users/:id` sem token → 401 (`Invalid or missing token`).
- `DELETE /users/:id` como `ronaldinho@admin.com` (sem permissão de delete) → 403 (`Você não tem permissão para delete user`).
- `DELETE /users/:id` com id inexistente → 404 (`O registro de 'Usuário' não foi encontrado.`).
- Sucesso: criar usuário via `POST /users` (fixture própria, e-mail/CPF distintos), vincular paróquias via `PATCH /users/:id/paroquias`, `DELETE /users/:id` → 204 com corpo vazio (`res.body` `{}`); comprovar que `GET /users/:id` responde 404 e que os vínculos `usuarioParoquia` foram removidos (consulta via `PrismaService`, padrão usado na suíte de comunidade).

## Risks / Trade-offs

- **Contrato de resposta quebrado (200 com corpo → 204 vazio)** → Mudança intencional e **BREAKING** (registrada no proposal). Mitigação: cobertura e2e do novo contrato; clientes existentes precisam tratar 204.
- **`@Res()` cru na rota** → Desvia do fluxo padrão de envelope; erros ainda passam pelos filtros globais. Mitigação: casos e2e 401/403/404 cobrem a rota para garantir que o tratamento de erro não foi afetado.
- **Exclusão física e irreversível** → Vínculos `usuarioParoquia` cascateiam; `pessoa`, `email` e demais dados de domínio são preservados. Não há soft delete neste escopo.
- **Leak de hash caso alguém reintroduza o retorno cru** → Mantido na revisão: `remove` não retorna dados; a suíte de sucesso valida corpo vazio e ausência de dados sensíveis.

## Migration Plan

Nenhuma alteração de schema — não há migração, logo não há plano de deploy/rollback de banco.

## Open Questions

Nenhuma — as duas definições-chave foram confirmadas pelo domínio: exclusão apenas da conta (pessoa preservada) e resposta `204` sem corpo.