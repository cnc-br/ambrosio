# Design

## Context

O model `pessoa` já implementa o padrão alvo: colunas `cadastradoPorId`/`atualizadoPorId` (`String?`, FK para `user` com `onDelete: SetNull`, índices), relações `cadastradoPor`/`atualizadoPor`, `createdAt`/`updatedAt`, e gravação da autoria via `@CurrentUser('id')` no controller → serviço (`pessoa.service.ts:create/update`). O serializer de `pessoa` remove os campos das respostas.

O schema atual tem 34 models. Excluídos: `user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution` e o enum `ScheduledJobStatus`. `pessoa` já está pronto. Restam **29 models** a receber auditoria (20 também precisam de `createdAt`/`updatedAt`).

Rotas de escrita atuais: com `AuthGuard`+`RoleGuard` (`carisma`, `comunidade`, `comunidade/:id/etapa`, `equipe`, `paroquia`, `diocese`, `localidade`, `estado-civil`, `avisos`, `pessoa`) e **públicas sem guard** (`endereco`, `pais`). Motivação e escopo: ver `proposal.md`.

## Goals / Non-Goals

**Goals:**
- Um único padrão de auditoria (espelho do `pessoa`) aplicado a todas as tabelas não excluídas, via uma única migration.
- Preencher autoria nas rotas de escrita existentes, propagando o `@CurrentUser` pelos fluxos aninhados (endereco → pais/estado/cidade/pessoaEndereco; equipe → equipePessoa; comunidade → comunidadeHistorico; carisma → pessoaCarisma; comunidade → comunidadePessoa/comunidadeEtapa; pessoa/casal → pessoaCasal).
- Manter rotas públicas funcionando com autenticação opcional (`OptionalAuthGuard`).
- Não expor `cadastradoPorId`/`atualizadoPorId` em nenhuma resposta.
- Registrar em `AGENTS.md`/`CLAUDE.md` a regra mandatória para novas tabelas.

**Non-Goals:**
- Não criar rotas de escrita para tabelas hoje sem rota (`setor`, `regiao`, `macroRegiao`, `escolaridade`, `situacaoReligiosa`, `tipoDiocese`, `tipoEquipe`, `tipoLocalidade`, `etapa`, `passaportePessoa`) — campos permanecem `NULL`.
- Não alterar CASL/permissões existentes (a auditoria não adiciona requisito de permissão).
- Não fazer backfill de autoria/timestamps de registros legados.
- Não registrar quem **excluiu** registros (fora do pedido).
- Não criar `CONTEXT.md` (ver Decisão 7).

## Decisions

### 1. Padrão de schema espelhando o model `pessoa`

Cada model não excluído ganha:

```prisma
cadastradoPorId String?
atualizadoPorId String?
cadastradoPor   user?  @relation("<Model>CadastradoPor", fields: [cadastradoPorId], references: [id], onDelete: SetNull)
atualizadoPor   user?  @relation("<Model>AtualizadaPor", fields: [atualizadoPorId], references: [id], onDelete: SetNull)
createdAt       DateTime @default(now())   // só onde não existir
updatedAt       DateTime @default(now()) @updatedAt // só onde não existir

@@index([cadastradoPorId])
@@index([atualizadoPorId])
```

E o model `user` ganha as relações de retorno seguindo a convenção existente `pessoasCadastradas`/`pessoasAtualizadas`: `<modelos>Cadastrados`/`<modelos>Atualizados`.

**Alternativa considerada**: colunas soltas sem `@relation` (menos código no `user`, sem `SetNull`). **Rejeitada** por: (a) consistência com `pessoa`; (b) auditoria consultável (`include: { cadastradoPor: { select: { email } } }`); (c) integridade referencial ao apagar usuário. Custo aceito: ~56 campos de relação no `user` — mecânico e com nomeação única por model.

### 2. Uma única migration, sem quebra de dados

Todos os campos novos são nullable ou com `@default`, então a migration (`prisma migrate dev`) é segura sobre dados existentes. Registros legados recebem `createdAt` = instante da migration (não há data de criação histórica). Rollback simples: as colunas são descartáveis.

### 3. Gravação da autoria via `@CurrentUser('id')`

Mesmo padrão do `pessoa`: controller passa `@CurrentUser('id') userId` aos métodos de serviço de criação/atualização; o serviço grava `cadastradoPorId` + `atualizadoPorId` no create e apenas `atualizadoPorId` no update. Em serviços chamados também por seed/outros serviços, o parâmetro é opcional (`userId?: string`), gravando `NULL` quando ausente.

### 4. Rotas públicas ganham autenticação opcional

`endereco` e `pais` (sem guard hoje) recebem `OptionalAuthGuard` nas rotas de escrita + `@CurrentUser('id')`: com token válido grava autoria; sem token mantém o acesso público atual e grava `NULL`. Comportamento já coberto pela spec `contexto-usuario` (token inválido → 401).

### 5. Propagação do `userId` em fluxos aninhados

- `endereco.create`/`createByPessoaId`/`update` → repassa `userId` para `PaisService.create`, `EstadoService.createOrSelect`, `CidadeService.createOrSelect` e `pessoaEndereco.create` (parâmetros opcionais).
- `equipe.create`/`update` → repassa para `syncEquipePessoas` (upsert em `equipePessoa`).
- `comunidade.create`/`update`/`adicionarPessoa` → repassa para `historicoService.create` (`comunidadeHistorico`).
- `carisma.addCarismaToPessoa` → grava em `pessoaCarisma`.
- `casalService.createCasal` → grava em `pessoaCasal`.

### 6. Não exposição via interceptor global

Novo interceptor global `AuditoriaInterceptor` (registrado **antes** do `PaginationInterceptor` para ver o envelope final) remove `cadastradoPorId` e `atualizadoPorId` de todos os objetos do payload (recursivo). **Alternativa considerada**: serializers por recurso como `pessoa` — **rejeitada** porque a maioria dos serviços retorna a entidade crua do Prisma e a manutenção por recurso vazaria campos com facilidade.

### 7. Regra para novas tabelas em `AGENTS.md` (não `CONTEXT.md`)

Nova subseção **2.4 "Campos de Auditoria Obrigatórios"** em `AGENTS.md` (seção "Princípios Mandatórios de Engenharia"), listando os 4 campos, as exceções (`user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution`, `ScheduledJobStatus`) e a obrigatoriedade para toda nova tabela. Nota curta em `CLAUDE.md` ("Convenções transversais") apontando para a regra. **Não** criar `CONTEXT.md`: `AGENTS.md` é o manual canônico lido por todos os agentes (Antigravity, Copilot, OpenSpec, Cursor, Claude, Hermes) e já é referenciado em todo o repositório; um novo arquivo fragmentaria a orientação.

## Risks / Trade-offs

- **[~56 relações novas no `user`]** → Nomeação padronizada e gerada em bloco único; `prisma validate` e code review mecânico.
- **[`createdAt` de registros legados = data da migration]** → Aceito (sem dado histórico); documentar na migration e no `AGENTS.md`.
- **[Sanitização global pode remover campos em respostas que os precisem]** → Nenhum endpoint usa esses campos hoje; testes e2e garantem a não exposição e a forma do envelope.
- **[`OptionalAuthGuard` em rotas públicas: token inválido passa a dar 401]** → Já é o comportamento definido na spec `contexto-usuario`; clientes atuais sem token não são afetados.
- **[Esquecimento de tabela na migration]** → Tarefa de verificação enumera os models e compara com a lista-alvo; `prisma migrate dev` cria o diff completo.

## Migration Plan

1. Editar `prisma/schema.prisma` (28 models + relações no `user`).
2. `npx prisma migrate dev --name add_auditoria_criacao_edicao` (colunas nullable/default → sem downtime); `npx prisma generate`.
3. Implementar wiring por módulo + interceptor + documentação (sequência em `tasks.md`).
4. `npm run lint`, `npm run build`, `npm test`, `npm run test:e2e`.
5. Rollback: `npx prisma migrate` (reverter a migration); colunas são descartáveis sem perda funcional.

## Open Questions

Nenhuma. A nomeação das relações de retorno no `user` segue a convenção existente (`<modelos>Cadastrados`/`<modelos>Atualizados`) e pode ser decidida durante a implementação sem afetar specs, abordagem ou tarefas.
