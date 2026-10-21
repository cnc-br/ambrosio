# Design

## Context

Ver `proposal.md` — Why. O controle de acesso do projeto usa CASL com `@casl/prisma`: `CaslAbilityService` (request-scoped) monta a `ability` a partir do `user`, e serviços como `paroquia`, `pessoa` e `diocese` já filtram consultas com `accessibleBy(ability, 'read').<modelo>`. Hoje, para `SECRETARIA_CNC`, `CaslAbilityService` concede `can('read', 'comunidade')` **sem condição**, então `ComunidadeService.findAll` retorna tudo. O vínculo usuário→paróquia está em `usuarioParoquia` (`userId`, `paroquiaId`), e `comunidade.paroquiaId` liga a comunidade à paróquia.

## Goals / Non-Goals

**Goals:**
- Restringir a listagem de comunidades (`GET /comunidade`) do perfil `SECRETARIA_CNC` às paróquias vinculadas em `usuarioParoquia`.
- Reaproveitar o padrão de autorização existente (condição CASL + `accessibleBy`), sem duplicar a regra em cada serviço.
- Manter `ADMIN` e demais perfis inalterados; resultar em lista vazia (200) quando não houver nada no escopo.

**Non-Goals:**
- Não alterar `findOne`, `update`, `delete` nem rotas de outros recursos nesta mudança.
- Não mudar o schema Prisma (a tabela `usuarioParoquia` já existe).
- Não restringir outros roles (ex.: `SECRETARIA_PAROQUIA`) agora.

## Decisions

- **Modelar o escopo como condição CASL da permissão de `comunidade`, não como filtro ad-hoc no serviço.** Em `CaslAbilityService`, para `SECRETARIA_CNC`, a regra passa a ser:
  ```ts
  can('read', 'comunidade', {
    paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } },
  });
  ```
  Usa-se `is` (relação to-one `comunidade.paroquia`) e `some` (relação to-many `paroquia.usuarioParoquias`). O `@casl/prisma` exige um operador de relação (`is`, `some`, `every`, `none`, `isNot`) em condições de relação — por isso o formato acima. Alternativa descartada: consultar `usuarioParoquia` no serviço e filtrar por `paroquiaId: { in: [...] }`; funcionaria, mas duplicaria a regra de autorização fora do CASL e adicionaria uma consulta extra.
- **Aplicar o filtro em `ComunidadeService.findAll` combinando com os filtros existentes via `AND`:**
  ```ts
  const where: Prisma.comunidadeWhereInput = {
    AND: [
      accessibleBy(this.abilityService.ability, 'read').comunidade,
      {
        ...(paroquiaId != null && { paroquiaId }),
        ...(numeroDaComunidade != null && { numeroDaComunidade }),
      },
    ],
  };
  ```
  Para perfis sem condição (ex.: `ADMIN`), `accessibleBy` resulta em `{}`, preservando o comportamento atual. A interseção com `paroquiaId`/`numeroDaComunidade` garante que o filtro explícito nunca amplie o escopo.
- **Lista vazia em vez de 403 para escopo vazio.** `validateReadAbility('comunidade')` continua validando a permissão (regra existe, então passa). Sem paróquias vinculadas — ou com `paroquiaId` fora do escopo — a condição não casa com nenhum registro, resultando em 200 com lista vazia, conforme decidido.
- **Validação por e2e com usuário `SECRETARIA_CNC` semeado.** Como não há usuário desse perfil no seed nem suíte de comunidade, incluir no seed um usuário `SECRETARIA_CNC` vinculado à paróquia 1 (que tem 10 comunidades) e criar `test/comunidade.e2e-spec.ts` cobrindo: vê só as suas, `ADMIN` vê todas, sem vínculo vê vazio, `paroquiaId` fora do escopo vê vazio.

## Risks / Trade-offs

- [Uso incorreto de operador de relação no CASL] → fixar `is`/`some` e cobrir com e2e; o interpretador lança erro para formato inválido.
- [`accessibleBy` lança `ForbiddenError` quando não há regra] → não é o caso (a regra existe para `SECRETARIA_CNC`); manter `validateReadAbility` antes, para respostas 403 coerentes.
- [Acoplamento dos testes a dados de seed (ids 1..5 de paróquia)] → documentar no teste que a paróquia 1 tem 10 comunidades do seed; ajustar junto se o seed mudar.
- [Extensão futura a outras rotas/re cursos] → a regra fica centralizada no CASL; aplicar o mesmo `accessibleBy` nos demais `findAll` quando o escopo for expandido.

## Migration Plan

Não aplicável — sem mudança de schema nem migração de dados. Rollback: reverter a condição em `CaslAbilityService` e o `AND` em `ComunidadeService.findAll`.

## Open Questions

Nenhuma.
