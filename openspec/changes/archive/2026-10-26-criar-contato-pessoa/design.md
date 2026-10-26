# Design

## Context

- O modelo `pessoaContato` já existe em `prisma/schema.prisma` com os campos `telefoneResidencial`, `telefoneCelular`, `observacao`, `ativo` (default `true`), `email`, `contatoPrincipal` (default `false`), `pessoaId` e a relação `pessoa` com `onDelete: Cascade`. **Não há mudança de schema nem migração.**
- O `PessoaController` (`src/pessoa/pessoa.controller.ts`) é protegido na classe com `AuthGuard` e `RoleGuard`, então a nova rota herda autenticação/autorização automaticamente.
- O sub-recurso já existente `CasalService` (`src/pessoa/casal/casal.service.ts`) segue o padrão estabelecido: serviço próprio herdando `BaseService`, com `@Injectable` e uso direto do `PrismaService`. A nova rota segue esse mesmo padrão.
- O `PrismaExceptionsFilter` converte `P2025` de `findUniqueOrThrow` em 404 com mensagem `O registro de '<Modelo>' não foi encontrado.` (`pessoa` → `Pessoa`). Motivação e escopo: ver proposal.md.

## Goals / Non-Goals

**Goals:**
- Expor `POST /pessoa/:id/contato` criando exatamente **um** contato por requisição.
- Garantir a invariante de no máximo um contato principal por pessoa, com swap atômico (rebaixar os demais para `false`) na mesma transação.
- Reutilizar a autorização CASL existente (`create` sobre `pessoa`) sem alterar regras de permissão.

**Non-Goals:**
- Rotas de listagem, atualização ou exclusão de contatos (escopo futuro).
- Criação em lote (array de contatos).
- Nova permissão CASL específica para `pessoaContato` (o tipo `PermissionResource` não inclui o modelo; reutiliza-se `create pessoa`).
- Migração Prisma ou mudança no schema.

## Decisions

### 1. Novo `ContatoService` em `src/pessoa/contato/contato.service.ts`

Seguir o padrão do `CasalService`: classe `@Injectable()` estendendo `BaseService`, com `PrismaService` injetado e validação de permissão via `this.validateCreateAbility('pessoa')` (mesmo recurso usado pelo `createPessoa` e `createCasal`).
- *Alternativa considerada:* adicionar o método ao `PessoaService`. Rejeitada por consistência com o padrão de sub-recurso existente (`casal`), mantendo o `PessoaService` focado na pessoa e o `BaseService` compartilhado.
- Registro do provider no `PessoaModule` (assim como `CasalService`).

### 2. Rota `POST /pessoa/:id/contato` no `PessoaController`

- `@Post('/:id/contato')`, `@Param('id') id: string` convertido com `+id`, `@Body() createPessoaContatoDto: CreatePessoaContatoDto`.
- Decoradores Swagger: `ApiCreatedResponse`, `ApiBadRequestResponse`, `ApiNotFoundResponse` e `ApiBody` com exemplo, no mesmo estilo dos endpoints existentes (`create` e `createCasal`).

### 3. DTO `CreatePessoaContatoDto` em `src/pessoa/dto/create-pessoa-contato.dto.ts`

Campos com `class-validator` no padrão dos DTOs existentes (`IsString`/`IsOptional` para telefones e observação, `IsEmail` + `IsOptional` para `email`, `IsBoolean` + `IsOptional` para `ativo` e `contatoPrincipal`). `MaxLength` opcional para telefones/observação, alinhado aos limites razoáveis de cadastro (o modelo não impõe tamanho).
- `ativo` e `contatoPrincipal` **não são obrigatórios** no DTO: quando ausentes, o Prisma aplica os defaults do modelo (`true` / `false`).

### 4. Swap do contato principal em transação

Fluxo do `ContatoService.create(pessoaId, dto)` dentro de `this.prisma.$transaction(async (tx) => {...})`:
1. `tx.pessoa.findUniqueOrThrow({ where: { id: pessoaId } })` — garante 404 (`O registro de 'Pessoa' não foi encontrado.`) quando a pessoa não existe.
2. Se `dto.contatoPrincipal === true`: `tx.pessoaContato.updateMany({ where: { pessoaId, contatoPrincipal: true }, data: { contatoPrincipal: false } })` — rebaixa o principal anterior (0 linhas quando não há, inofensivo).
3. `tx.pessoaContato.create({ data: { pessoaId, ...campos } })` e retorna o contato criado.

A transação garante atomicidade: ou o swap acontece junto com a criação, ou nada é persistido.
- *Alternativa considerada:* permitir dois principais e rejeitar com 409/400. Rejeitada conforme decisão do usuário: o comportamento escolhido foi **swap** (o novo contato vira o principal e os demais são rebaixados).

## Risks / Trade-offs

- **Concorrência no swap** → Duas criações simultâneas com `contatoPrincipal: true` podem, teoricamente, terminar com dois principais. Mitigação: a transação default do Prisma é serializável no nível de isolamento usual do Postgres; cenário de baixa probabilidade e impacto limitado. Caso vire exigência, uma constraint única parcial (index parcial em `pessoaId` onde `contatoPrincipal = true`) exigiria migração — fora do escopo.
- **Permissão genérica `create pessoa`** → A rota usa a mesma permissão de criação de pessoa, não distingue contato. Trade-off aceito: `pessoaContato` não está em `PermissionResource` e ampliá-lo afetaria CASL/roles em vários pontos — fora do escopo desta mudança.
- **Sem `MODEL_NAME_MAP` para `pessoaContato`** → Se um dia um `findUniqueOrThrow` sobre `pessoaContato` gerar P2025, o filtro cairia no fallback `Registro não encontrado.`. Nesta rota a validação de existência é sobre `pessoa`, já mapeado. Não requer ação agora.

## Migration Plan

- Sem alteração de schema nem banco: o modelo `pessoaContato` e sua tabela já existem. Nenhuma migração Prisma necessária.
- Rollback: reverter os commits do controller/DTO/serviço/testes; nenhum dado é migrado nem destruído pela feature em si.

## Open Questions

Nenhuma — as decisões de comportamento (swap, um contato por requisição) foram confirmadas com o usuário durante o planejamento.