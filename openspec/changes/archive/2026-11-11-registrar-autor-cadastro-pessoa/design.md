# Design

## Context

Ver `proposal.md — Why`. O estado atual relevante:

- `pessoa` guarda apenas dados locais (`externalId`, `situacaoReligiosaId`, `ativo`) e já possui `createdAt`/`updatedAt` desde a migration inicial (`20260218233523_create_all_tables_prisma_seven`); esses campos não fazem parte deste change.
- `user.id` é `String` (`cuid`); `pessoa.id` é `Int`. Não existe campo de nome em `user`.
- `PessoaController` é protegido por `AuthGuard`; `request.user` já é populado com o registro completo do usuário e `@CurrentUser('id')` é o padrão usado em `AuthController`.
- `PessoaService.create` cria na API externa São Pedro e depois na tabela local; `update` atualiza a situação religiosa localmente **antes** de chamar a API externa e retorna o objeto serializado obtido no início.
- `serializePessoaResponse` monta a resposta por allowlist explícita; nenhum campo novo do Prisma vaza automaticamente.

## Goals / Non-Goals

**Goals:**

- Persistir a autoria do cadastro e da última atualização sem alterar nenhum contrato HTTP.
- Garantir que a autoria venha exclusivamente do usuário autenticado.
- Manter `pessoa` íntegra quando um usuário autor for excluído.

**Non-Goals:**

- Criar tabela de histórico de auditoria ou registrar cada alteração de campo.
- Expor os campos de auditoria em qualquer endpoint ou DTO.
- Fazer backfill dos registros existentes.
- Criar ou alterar campos de data: `createdAt`/`updatedAt` já existem e permanecem como estão.
- Alterar a API externa São Pedro.

## Decisions

### 1. `cadastradoPorId`/`atualizadoPorId` como `String?` com FK para `user.id`

Ambos são `String?` com relações nomeadas para `user`:

```prisma
model pessoa {
  cadastradoPorId String?
  atualizadoPorId String?
  cadastradoPor   user?   @relation("PessoaCadastradaPor", fields: [cadastradoPorId], references: [id], onDelete: SetNull)
  atualizadoPor   user?   @relation("PessoaAtualizadaPor", fields: [atualizadoPorId], references: [id], onDelete: SetNull)
}

model user {
  pessoasCadastradas pessoa[] @relation("PessoaCadastradaPor")
  pessoasAtualizadas pessoa[] @relation("PessoaAtualizadaPor")
}
```

- **Rationale**: `user.id` é `String` (cuid); modelar como `Int` ou sem FK perderia integridade. Relações nomeadas são obrigatórias porque `pessoa` já tem outra relação com `user` (`pessoaId`).
- **Nullabilidade**: registros anteriores ficam `NULL`; não há identificador válido para backfill e o valor textual "Leonardo - Sistema" não é um id.
- **`onDelete: SetNull`**: excluir um usuário não pode falhar nem apagar a pessoa; a autoria histórica perde a referência, o que é aceitável para auditoria não crítica.
- **Alternativas rejeitadas**: coluna de texto livre (sem integridade e sujeita a divergência); FK obrigatória com default (não existe id default válido).

### 2. Identidade vem do controller via `@CurrentUser('id')`

`PessoaController` passa a declarar `@CurrentUser('id') userId: string` em `create` e `update`; o service recebe o id como parâmetro explícito:

```ts
create(dto: CreatePessoaDto, userId: string, comunidadeId?: number)
update(id: number, dto: UpdatePessoaDto, userId: string)
```

- **Rationale**: o `AuthGuard` já garante que existe usuário autenticado; o decorator é o padrão do projeto e evita ler identidade do payload (que seria forjável).
- **`userId` obrigatório no service**: torna impossível criar/atualizar pelo fluxo HTTP sem autoria. A nulabilidade existe apenas para linhas legadas.
- **Alternativa rejeitada**: ler `request.user` diretamente no service — quebraria o desacoplamento e a testabilidade.

### 3. Gravação da autoria

- **Create**: `prisma.pessoa.create` inclui `cadastradoPorId: userId` e `atualizadoPorId: userId`. O criador é também o último atualizador inicial.
- **Update**: o fluxo atual permanece (situação religiosa local antes da chamada externa); **após** o sucesso de `updateExternalPessoa`, uma escrita local grava apenas `atualizadoPorId: userId`.
- **Rationale**: registrar a autoria somente depois do sucesso externo evita atribuir a edição a um usuário quando a operação falhou, com a menor mudança possível no fluxo existente.
- **Trade-off registrado**: se a atualização da situação religiosa tiver sido gravada e a chamada externa falhar, o comportamento parcial atual é mantido — este change não altera essa ordem, apenas não grava a autoria.
- **Alternativa rejeitada**: mover toda a escrita local para depois da chamada externa — ampliaria o escopo comportamental além da autoria.

### 4. Respostas inalteradas por allowlist

`serializePessoaResponse` continua sendo a única projeção de resposta; os novos campos do model não são adicionados a ela. A garantia é coberta por teste de regressão, sem introduzir `@Exclude`/class-transformer.

- **Alternativa rejeitada**: serialização por exclusão — o projeto usa allowlist e trocar o modelo exporia campos por padrão.

## Risks / Trade-offs

- **Exclusão de usuário zera a autoria histórica (`SetNull`)** → trade-off aceito para não bloquear a exclusão nem apagar pessoas; auditoria não é requisito legal neste momento.
- **Linhas legadas com autoria `NULL`** → não são exibidas na API; consumidores internos devem tratar ausência.
- **Campos de data intocados** → `createdAt`/`updatedAt` continuam com o comportamento atual, sem relação com a autoria.
- **Deploy**: o código novo requer as colunas novas. A migration é compatível com o código antigo (colunas nullable), então deve ser aplicada antes do deploy da aplicação.

## Migration Plan

1. Atualizar `prisma/schema.prisma` e gerar a migration com `npx prisma migrate dev --name alter_table_pessoa_add_autoria`; o SQL deve conter apenas `ALTER TABLE "pessoa" ADD COLUMN` para as duas colunas e as FKs com `ON DELETE SET NULL`.
2. Aplicar a migration em produção antes de subir a aplicação.
3. Rollback: reverter o deploy da aplicação e, se necessário, dropar as duas colunas e constraints — perde-se apenas a autoria coletada, nenhum dado de pessoa.
