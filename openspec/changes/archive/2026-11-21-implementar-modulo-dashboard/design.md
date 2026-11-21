# Design

## Context

Ver `proposal.md` — Why. Pontos do estado atual que restringem o desenho:

- `PaginationInterceptor` é global (`APP_INTERCEPTOR` no `AppModule`) e envelopa **toda** resposta em `{ server, total, page, limit, data }`, inclusive objetos. O dashboard herda esse envelope sem código extra.
- `CaslAbilityService` tem escopo de requisição (`Scope.REQUEST`), enquanto `PrismaService` é compartilhado. O padrão já usado em `MaintenanceController` é manter o service singleton e fazer a checagem CASL no controller.
- `PrismaService` expõe o client Prisma direto (`count`, `groupBy`), e as entidades contadas (`pessoa`, `paroquia`, `diocese`, `comunidade`, `equipe`, `carisma`, `pessoaCarisma`, `user`) não têm relação de dependência entre si no cálculo.
- Não há Redis, cache manager nem fila no projeto; `@nestjs/schedule` existe, mas não é necessário para esta entrega.
- A mudança `reorganizar-permissoes-e-roles` está concluída mas não arquivada; o gate de acesso escolhido (`read pessoa`) continua válido em ambos os mapas de papéis.

## Goals / Non-Goals

**Goals:**

- Um único `GET /dashboard` que devolve todos os indicadores do v1 em um round-trip.
- Números sempre derivados da base, com no máximo 60s de defasagem.
- Nenhuma alteração de schema, migration ou dependência.
- Autorização e privacidade explícitas: só contagens, nenhum dado pessoal.

**Non-Goals:**

- Séries temporais, filtros por período, comparação com período anterior.
- Recorte por paróquia/região (decidido: números globais).
- Contadores denormalizados, materialized views ou snapshots agendados.
- Cache distribuído ou invalidação ativa por eventos de escrita.

## Decisions

### 1. Calcular sob demanda, não persistir agregados

`DashboardService` executa as contagens a cada ciclo de cálculo com `count`/`groupBy` do Prisma, agregando em um objeto único. Contadores persistidos foram descartados porque exigiriam escrita transacional em todo `create/update/delete` das entidades contadas, rotina de recálculo e migration — com risco permanente de divergência silenciosa. Materialized view também foi descartada nesta fase: adiciona migration, refresh e staleness maior que 60s sem necessidade comprovada.

### 2. Métricas em um único ciclo, com queries em paralelo

O cálculo dispara as contagens independentes em `Promise.all`:

| Indicador | Consulta |
| --- | --- |
| `pessoas.total/ativas/inativas` | `pessoa.groupBy({ by: ['ativo'], _count: true })` |
| `paroquias` | `paroquia.count()` |
| `dioceses` | `diocese.count()` |
| `comunidades` | `comunidade.count()` |
| `equipes` | `equipe.count()` |
| `carismas.total` | `carisma.count()` |
| `carismas.vinculos` | `pessoaCarisma.count()` |
| `usuarios.total` | `user.count()` |
| `usuarios.porPapel` | `user.groupBy({ by: ['role'], _count: true })` |

O `groupBy` de pessoas fornece `ativas` e `inativas` de forma coerente entre si; `total` é a soma dos dois grupos (não um `count()` separado), garantindo a invariante `ativas + inativas = total` da spec. Para usuários, `porPapel` é inicializado percorrendo `Object.values(roles)` com zero antes de aplicar o `groupBy`, de modo que papéis sem usuários apareçam na resposta.

### 3. Cache em memória com TTL e coalescência de requisições

O service guarda o último payload calculado e um `expiresAt` (`CACHE_TTL_MS = 60_000`). Detalhes:

- O cache armazena **apenas o objeto de indicadores**, nunca decisões de autorização. A checagem de acesso ocorre em toda requisição.
- Requisições concorrentes com cache expirado compartilham a mesma `Promise` de cálculo (in-flight), evitando rajadas de contagens no primeiro acesso após expirar.
- Se o cálculo falhar, o cache e a promise em voo são limpos para que a próxima requisição tente de novo.
- Premissa de instância única (a mesma já registrada no design do módulo de manutenção). Com múltiplas instâncias, cada uma terá seu próprio cache, o que apenas varia a defasagem dentro do limite de 60s — não afeta correção.

Alternativa considerada: `@nestjs/cache-manager` com store em memória. Descartada por adicionar dependência sem ganho sobre um cache de duas variáveis.

### 4. Autorização por CASL no controller

`AuthGuard` + `RoleGuard` no controller e, em seguida, checagem `abilityService.ability.can('read', 'pessoa')`. Sem permissão → `ForbiddenException`. Isso bloqueia `NAO_IDENTIFICADO` (que não tem `read pessoa` no mapa atual) e libera `ADMIN`, catequistas e secretarias sem duplicar a lista de papéis.

Alternativas consideradas:

- `@RequiredRoles(...)` com todos os papéis identificados: funcionaria, mas duplicaria o mapa de permissões e passaria a divergir a cada ajuste de papéis.
- Criar um subject CASL `dashboard`: mais correto semanticamente, porém exigiria alterar o mapa de todos os papéis nesta entrega; o gate por `read pessoa` é consistente com a natureza sensível dos agregados e pode ser trocado depois sem mudar o contrato HTTP.

### 5. Contrato de resposta e Swagger

`data` segue o formato abaixo, e o controller declara o envelope completo em `@ApiOkResponse` (mesmo padrão de `MaintenanceController`):

```json
{
  "pessoas": { "total": 100, "ativas": 90, "inativas": 10 },
  "paroquias": 12,
  "dioceses": 2,
  "comunidades": 30,
  "equipes": 8,
  "carismas": { "total": 4, "vinculos": 15 },
  "usuarios": { "total": 5, "porPapel": { "ADMIN": 3, "SECRETARIA_PAROQUIA": 2, "NAO_IDENTIFICADO": 0 } }
}
```

Os tipos vivem em `src/dashboard/dto/dashboard-response.dto.ts` apenas para documentação Swagger, sem `class-validator` (não há entrada).

### 6. Estrutura e registro do módulo

- `src/dashboard/dashboard.module.ts`: importa `CaslModule` e declara controller/service.
- `src/dashboard/dashboard.service.ts`: cálculo + cache.
- `src/dashboard/dashboard.controller.ts`: `GET /dashboard`, guards, CASL e Swagger.
- `AppModule.imports` recebe `DashboardModule`.

## Risks / Trade-offs

- **[Defasagem de até 60s]** → aceitável para um dashboard de leitura; documentado na spec e no Swagger. Se o negócio exigir tempo real, o TTL pode ser reduzido ou o cache removido sem mudar o contrato.
- **[Contagem com filtro em `pessoa.ativo` sem índice dedicado]** → com os volumes atuais (dezenas de milhares) o custo é baixo; se virar gargalo, criar índice em `pessoa.ativo` ou migrar para materialized view em mudança própria.
- **[Cache por instância]** → múltiplas réplicas podem divergir por até 60s; impacto limitado a números de tela, não a decisões de negócio.
- **[Gate por `read pessoa`]** → se o mapa de permissões mudar, o acesso ao dashboard muda junto. É intencional: os agregados incluem dados de pessoa, então o acesso deve acompanhar essa permissão.
- **[Uma falha em qualquer contagem derruba o payload inteiro]** → comportamento desejado: melhor 500 do que devolver números parciais que o front apresentaria como totais; o cache limpo permite nova tentativa.

## Migration Plan

Não há alteração de schema. Deploy é aditivo: importar `DashboardModule` no `AppModule` e publicar. Rollback = remover a importação do módulo (a rota deixa de existir) sem impacto em dados. Nenhum backfill é necessário.
