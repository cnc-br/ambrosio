# Design

## Context

- `ParoquiaService.remove(id)` (em `src/paroquia/paroquia.service.ts`) é um stub: retorna `This action removes a #${id} paroquia`. O controller já expõe `@Delete(':id')` (rota `DELETE /paroquia/:id`). Motivação: ver `proposal.md - Why`.
- `BaseService` já fornece `validateDeleteAbility(resource)` → lança `ForbiddenException` (403) quando o usuário não pode `delete` do recurso.
- CASL (`src/casl/casl-ability/casl-ability.service.ts`): apenas `ADMIN` possui `manage all`; os demais perfis só leem — na prática, apenas `ADMIN` consegue excluir.
- Schema Prisma atual:
  - `comunidade.paroquia` (`comunidade.paroquiaId → paroquia.id`) **não** declara `onDelete` → comportamento padrão `Restrict`: excluir uma paróquia com comunidades viola a FK.
  - `comunidadeEtapa`, `comunidadePessoa`, `comunidadeHistorico` e `usuarioParoquia.paroquia` já declaram `onDelete: Cascade`.
  - `endereco` é uma tabela compartilhada (`diocese`, `localidade` e `paroquia` apontam para ela), porém cada paróquia ganha um endereço próprio no `create` (`createParoquiaTransaction` cria um novo `endereco` com `observacao` `End. da paróquia ...`). O pedido é excluir também o endereço vinculado (`enderecoId`).
- `PrismaExceptionsFilter` mapeia `P2025` (`RECORD_DOES_NOT_EXIST`) → 404 com `O registro de 'Paroquia' não foi encontrado.` (`MODEL_NAME_MAP`), e `FOREIGN_KEY_CONSTRAINT` → 404.
- Respostas passam pelo `PaginationInterceptor`: corpo sempre `{ server, total, page, limit, data }`.
- Padrão e2e definido pela spec `testes-e2e` (setup padronizado, títulos pt-br `/<rota> (MÉTODO) - <status> | <descrição>`, cobertura 401/403/404 e caminhos de sucesso).

## Goals / Non-Goals

**Goals:**
- Excluir fisicamente uma paróquia por id em `DELETE /paroquia/:id`, com `validateDeleteAbility('paroquia')` antes da exclusão.
- Garantir integridade referencial na exclusão: as comunidades vinculadas (e seus históricos, vínculos de pessoas e etapas) são removidas pela cascata do Prisma, e o `endereco` vinculado (`enderecoId`) também é excluído.
- Cobertura e2e do novo endpoint seguindo a spec `testes-e2e`.

**Non-Goals:**
- Soft delete / inativação — a exclusão é física e irreversível.
- Excluir `diocese` ou `setor` da paróquia.
- Introduzir scoping de paróquia na exclusão (fora do que `validateDeleteAbility` já oferece).

## Decisions

### 1. Cascata no nível do banco via `onDelete: Cascade` na relação `comunidade.paroquia`

Adicionar `onDelete: Cascade` no lado `comunidade` da relação `comunidade.paroquia` no `prisma/schema.prisma` e gerar a migração. Com isso, `paroquia.delete` dispara a exclusão em cascata das comunidades no banco, que por sua vez removem seus dependentes já em cascata.

**Por quê:** é a leitura direta do pedido ("ver o delete cascade do prisma"); garante consistência no nível da FK, sem depender de lógica duplicada no service; a cadeia `comunidade → comunidadeEtapa/comunidadePessoa/comunidadeHistorico` e `paroquia → usuarioParoquia` já está declarada no schema.

**Alternativa considerada:** excluir as comunidades manualmente no service (`deleteMany`) antes do `paroquia.delete`, como o `CarismaService` faz com `pessoaCarisma`. Rejeitada como abordagem principal: deixa a FK ainda `Restrict` (exclusão futura por outras vias continuaria bloqueada), duplica a regra de cascade no código e pode deixar órfãos se novos dependentes da paróquia surgirem sem cascade.

**Nota sobre o endereço:** a exclusão do `endereco` **não** pode ser feita por `onDelete: Cascade` no schema — a FK está no lado `paroquia` (`paroquia.enderecoId → endereco.id`), e `onDelete` nesse campo significaria "ao excluir o endereço, excluir a paróquia" (direção oposta e perigosa, pois um mesmo endereço poderia ser compartilhado). Por isso o endereço é excluído explicitamente no service, dentro da mesma transação da exclusão da paróquia.

### 2. `ParoquiaService.remove(id)` em transação, delegando erros ao filtro

```ts
async remove(id: number) {
  this.validateDeleteAbility('paroquia');

  const result = await this.prisma.$transaction(async (transaction) => {
    const paroquia = await transaction.paroquia.delete({
      where: { id },
      select: PAROQUIA_SELECT,
    });

    await transaction.endereco.delete({
      where: { id: paroquia.endereco.id },
    });

    return paroquia;
  });

  this.logger.log(`Paroquia id ${id} removida com sucesso`);
  return serializeParoquia(result);
}
```

- `validateDeleteAbility('paroquia')` → 403 (`Você não tem permissão para delete paroquia`) para quem não tem permissão.
- `paroquia.delete` com `select: PAROQUIA_SELECT` devolve a paróquia (incluindo `endereco.id`) como estava antes da exclusão — o id do endereço é obtido do próprio retorno, sem query extra.
- A transação garante atomicidade: se a exclusão do endereço falhar, a exclusão da paróquia (e a cascata das comunidades) é revertida.
- Não há `try/catch` local: `P2025` (paróquia inexistente) sobe para o `PrismaExceptionsFilter`, que responde 404 — mesmo comportamento/mensagem já usado em `findOne`.
- `serializeParoquia` mantém o contrato de resposta do módulo (mesmo select/serializer de `create`/`update`/`findAll`/`findOne`).

**Alternativa considerada:** retornar o resultado cru do `delete` (como `ComunidadeService.remove`). Rejeitada: os demais métodos deste módulo serializam com `PAROQUIA_SELECT`; serializar mantém o contrato de resposta do módulo.

### 3. Testes e2e em `test/paroquia.e2e-spec.ts`

Novos casos seguindo `testes-e2e`:
- `DELETE /paroquia/:id` sem token → 401 (`Invalid or missing token`).
- `DELETE /paroquia/:id` como `ronaldinho@admin.com` (sem permissão de delete) → 403 (`Você não tem permissão para delete paroquia`).
- `DELETE /paroquia/:id` com id inexistente → 404 (`O registro de 'Paroquia' não foi encontrado.`).
- `DELETE /paroquia/:id` com sucesso (token `admin@admin.com`): criar paróquia via `POST /paroquia` (anotando `data.endereco.id`), criar comunidade vinculada via `POST /comunidade` (`paroquiaId`), excluir a paróquia → 200 com `data.id`; comprovar a cascata: `GET /comunidade/:id` da comunidade criada → 404 e `GET /endereco/:id` do endereço da paróquia → 404.

## Risks / Trade-offs

- **Exclusão física e irreversível** → Mitigação: cascata restrita ao que está declarado no schema (comunidades e seus dependentes, `usuarioParoquia`) somada à exclusão explícita apenas do `endereco` da própria paróquia; `diocese` e `setor` não são removidos. Se for desejado recuperar dados, um soft delete seria um change futuro separado.
- **Endereço compartilhado com `diocese`/`localidade`** → Se o `enderecoId` da paróquia for referenciado por outro registro, a exclusão do endereço falha com `P2003` e a transação reverte toda a exclusão (paróquia e comunidades). Mitigação: no fluxo normal cada paróquia possui endereço exclusivo (criado em `createParoquiaTransaction`); o comportamento atômico evita exclusões parciais — vale confirmar com o domínio que endereços de paróquia nunca são compartilhados.
- **Migração de schema no banco compartilhado** → A mudança é aditiva (comportamento da FK). `migrate:deploy` executa a migração em prod/CI; rollback é reverter o `onDelete` no schema e gerar nova migração. Validar em banco local antes do deploy.
- **Erro de FK residual (P2003)** caso a migração de cascade não esteja aplicada e haja comunidades → O filtro responde 404 `ID informado não encontrado.`; a mitigação é aplicar a migração como pré-requisito (primeira tarefa da implementação).
- **Setor/diocese apontados por outras paróquias não são afetados** — a FK de paróquia é só `comunidade.paroquiaId` (já tratada) e `usuarioParoquia.paroquiaId` (já cascade).

## Migration Plan

1. `npx prisma migrate dev --name delete_paroquia_cascade_comunidades` (schema: `onDelete: Cascade` em `comunidade.paroquia`) — atualiza banco local e gera o cliente.
2. `npx prisma generate` (já executado pelo passo anterior, reexecutar se necessário).
3. Em ambientes gerenciados: `npm run migrate:deploy` para aplicar a migração pendente antes de subir a nova versão da API.
4. Rollback: remover `onDelete: Cascade` do schema e gerar migração reversa.

## Open Questions

Nenhuma — as duas definições-chave foram resolvidas a partir do pedido: a cascata de comunidades no banco via `onDelete: Cascade` ("ver o delete cascade do prisma", Decisão 1) e a exclusão do `endereco` vinculado (`enderecoId`), confirmada pelo domínio e implementada explicitamente no service (Decisão 2).