# Design

## Context

Ver `proposal.md` — Why e `specs/mapa/spec.md` para os requisitos. Hoje `src/mapa` reúne três módulos independentes (`MacroRegiaoModule`, `RegiaoModule` e `SetorModule`), importados diretamente pelo `AppModule`. Seus controllers expõem somente `GET`, sem guardas, e os services apenas `findAll`/`findOne`. Os models Prisma já têm a hierarquia `macroRegiao → regiao → setor`, o campo `ativo` e os campos de auditoria obrigatórios. O padrão de escrita do repositório (`paroquia`, `estado-civil`) usa `AuthGuard` + `RoleGuard`, `@CurrentUser('id')` para autoria e DTOs com objetos aninhados para chaves estrangeiras.

## Goals / Non-Goals

**Goals:**

- Expor `POST` e `PATCH` para macro-região, região e setor, com validação de hierarquia, autorização e auditoria.
- Manter a estrutura atual de módulos e a leitura pública, sem alterar URLs nem contratos de resposta.
- Estender o mapa CASL com os novos subjects sem ampliar permissões de outros papéis.

**Non-Goals:**

- Criar `MapaModule`, model/tabela `mapa` ou endpoint `/mapa`.
- Alterar `AppModule` ou a composição atual dos módulos do mapa.
- Expor `DELETE` de macro-região, região ou setor.
- Aplicar escopo territorial por setor às escritas do mapa; a manutenção da hierarquia é tratada como nacional.
- Alterar `findAll`/`findOne` ou seus includes.

## Decisions

### 1. Manter um módulo por recurso, sem agregador

Não criar `MapaModule`. `MacroRegiaoModule`, `RegiaoModule` e `SetorModule` continuam independentes e importados pelo `AppModule` como hoje. A única mudança de wiring é interna à hierarquia: `MacroRegiaoModule` passa a exportar `MacroRegiaoService`; `RegiaoModule` importa `MacroRegiaoModule` e exporta `RegiaoService`; `SetorModule` importa `RegiaoModule`, para validar as chaves estrangeiras.

**Por quê:** o agregador não muda comportamento observável, exigiria editar `AppModule` e ampliaria o escopo sem necessidade. `SetorModule` já é consumido por `ParoquiaModule` de forma isolada, e essa fronteira é mais clara mantendo os módulos separados.

**Alternativas:** `MapaModule` importando/reexportando os três (rejeitado: sem ganho funcional neste change); módulo único com todos os controllers/services (rejeitado: aumenta acoplamento e foge de um-controller-por-recurso).

### 2. Guardas por método, preservando GET público

Adicionar `@UseGuards(AuthGuard, RoleGuard)` e `@RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)` em cada método `POST`/`PATCH`, sem guarda no controller. Os `GET` permanecem públicos.

**Por quê:** os e2e atuais afirmam explicitamente `GET /macro-regiao`, `/regiao` e `/setor` sem autenticação retornando 200. Guarda no nível do controller quebraria esse contrato.

**Alternativas:** guarda no controller (rejeitado: breaking change de leitura); `AuthGuard` sem `RoleGuard` (rejeitado: `RoleGuard` sem `@RequiredRoles` libera qualquer autenticado).

### 3. DTOs com chave estrangeira aninhada e update parcial

Seguir o padrão de `CreateParoquiaDto`/`CreateCidadeDto`:

- `CreateMacroRegiaoDto`: `descricao` (`@IsString`, `@MaxLength(50)`), `ativo` opcional (`@IsBoolean`).
- `CreateRegiaoDto`: `descricao` (`@MaxLength(100)`), `macroRegiao: { id }`, `ativo` opcional.
- `CreateSetorDto`: `descricao` (`@MaxLength(50)`), `regiao: { id }`, `ativo` opcional.
- `Update*Dto`: `PartialType(Create*Dto)` de `@nestjs/mapped-types`, aceitando atualização parcial inclusive da FK.

**Por quê:** o repositório já recebe FKs como objetos aninhados (`diocese`, `setor`, `estado`), e `PartialType` é o padrão de update (`paroquia`, `localidade`, `diocese`).

**Alternativas:** aceitar `macroRegiaoId`/`regiaoId` diretos (rejeitado: inconsistente com os DTOs existentes); manter o `UpdateSetorDto` atual, que exige `id` no corpo (rejeitado: o id já vem da URL e impede update parcial).

### 4. Validação de hierarquia nos services

`MacroRegiaoService` não tem dependência de outro domínio. `RegiaoService` injeta `MacroRegiaoService` e valida `macroRegiao.id` com `findOne` antes de criar/atualizar. `SetorService` injeta `RegiaoService` e valida `regiao.id` da mesma forma. Em `update`, quando a FK não vier no payload, o vínculo atual é preservado.

**Por quê:** `findOne` usa `findUniqueOrThrow`, cuja falha é traduzida pelo `PrismaExceptionsFilter` em 404, mantendo a mensagem pt-br consistente.

**Alternativas:** validar via `prisma.findUnique` e lançar `NotFoundException` manual (rejeitado: duplica a tradução já centralizada); confiar na FK do banco (rejeitado: erro de FK chega como 404 genérico, sem validar antes e sem permitir testar o fluxo).

### 5. Escrita via `BaseService` e autoria do contexto

Os três services passam a estender `BaseService`, injetam `CaslAbilityService` (global via `CaslModule`) e chamam `validateCreateAbility`/`validateUpdateAbility` com os subjects `macroRegiao`, `regiao` e `setor`. Controllers recebem `@CurrentUser('id')` e repassam ao service:

- `create`: `cadastradoPorId: userId ?? null`, `atualizadoPorId: userId ?? null`.
- `update`: `atualizadoPorId: userId ?? null` (ou omite quando não houver usuário).

O `AuditoriaInterceptor` global já remove os campos de auditoria das respostas.

**Por quê:** segue `AGENTS.md` §2.4 e o padrão de `estado-civil`/`paroquia`; a dupla checagem (`RoleGuard` por papel + CASL por subject) mantém a autorização declarativa.

**Alternativas:** gravar autoria a partir do payload (rejeitado: viola a regra de nunca aceitar autoria do cliente).

### 6. CASL com os novos subjects, sem `delete`

Adicionar `macroRegiao`, `regiao` e `setor` aos imports e ao `Subjects<{...}>` de `PermissionResource`, e conceder a `SECRETARIA_CNC`:

```ts
{ action: 'create', subject: 'macroRegiao' },
{ action: 'update', subject: 'macroRegiao' },
{ action: 'create', subject: 'regiao' },
{ action: 'update', subject: 'regiao' },
{ action: 'create', subject: 'setor' },
{ action: 'update', subject: 'setor' },
```

`ADMIN` continua coberto por `manage all`. Nenhum outro papel recebe as capacidades.

**Por quê:** o `PermissionResource` atual não conhece os três models, então `validateCreateAbility('setor')` nem compila; sem as regras explícitas, `SECRETARIA_CNC` falharia com 403.

**Alternativas:** liberar `manage` nesses subjects para `SECRETARIA_CNC` (rejeitado: concederia `delete` sem requisito); usar apenas `RoleGuard` sem CASL (rejeitado: cria um segundo padrão de autorização só para o mapa).

## Risks / Trade-offs

- **Rota de escrita sem guarda** → cada método recebe `@UseGuards` e `@RequiredRoles`; e2e cobre 401 e 403 para `POST` e `PATCH`.
- **`RoleGuard` sem `@RequiredRoles` libera qualquer autenticado** → teste unitário do controller verifica os metadados de papéis em cada handler de escrita.
- **Leitura quebrada por guarda no controller** → guardas apenas nos métodos de escrita; e2e de leitura sem token continua passando.
- **`SECRETARIA_CNC` movimentando setor para fora do próprio escopo** → aceito conscientemente: a hierarquia do mapa é gerida nacionalmente; se houver necessidade de escopo, será um change futuro.
- **Duplicidade de `regiao`/`setor`** → as constraints Prisma existentes (`descricao + macroRegiaoId`, `descricao + regiaoId`) geram 400 via `PrismaExceptionsFilter`; e2e cobre o caso.
- **DTO de update parcial aceitando payload vazio** → PATCH vazio é aceito e devolve o registro inalterado, comportamento inofensivo e coberto pelos testes.
- **Cadeia de imports/exports dos módulos** → `MacroRegiaoModule` exporta `MacroRegiaoService`; `RegiaoModule` importa `MacroRegiaoModule` e exporta `RegiaoService`; `SetorModule` importa `RegiaoModule`. Não há ciclo e o `AppModule` continua importando os três.

## Migration Plan

1. Implantar DTOs, rotas, serviços e permissões CASL.
2. Ajustar imports/exports internos de `RegiaoModule` e `SetorModule` e exportar `MacroRegiaoService`/`RegiaoService` para a validação de hierarquia; `AppModule` não muda.
3. Não há migration de banco nem de dados.
4. Rollback: remover as rotas `POST/PATCH`, os DTOs de escrita, os métodos `create`/`update` e os subjects/regras CASL, restaurando os services/controllers ao estado anterior. Como não há alteração de schema, não há dados a reverter.

## Open Questions

Nenhuma pendente.
