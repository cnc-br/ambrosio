# Design

## Context

Ver `proposal.md` — Why. A spec `escopo-acesso-paroquia` (change arquivado `2026-10-21-escopo-comunidades-por-paroquia`) já restringe a **leitura** de comunidade do `SECRETARIA_CNC` às paróquias vinculadas em `usuarioParoquia`, modelando a regra como condição CASL e aplicando via `accessibleBy` em `ComunidadeService.findAll`. Hoje:

- `CaslAbilityService` (request-scoped, construído a partir do usuário): apenas `ADMIN` tem `manage all`; `SECRETARIA_CNC` tem `can('read', 'comunidade', { paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } } })` e nenhuma permissão de escrita.
- `ComunidadeService.create` chama `paroquiaService.findOne(paroquiaId)` (leitura não escopada por vinculo — `SECRETARIA_CNC` lê paróquia sem condição) e depois cria a comunidade.
- `ComunidadeService.update(id, dto)` atualiza via `prisma.comunidade.update({ where: { id } })`, sem condição de escopo.
- `test/comunidade.e2e-spec.ts` já provisiona `secretaria@admin.com` (`SECRETARIA_CNC` vinculada à paróquia 1 via `usuarioParoquia`) e `secretaria-sem-paroquia@admin.com` (`SECRETARIA_CNC` sem vínculos).
- Suffixos de erro: `PrismaExceptionsFilter` responde 404 para `P2025`/`P2003` com as mensagens mapeadas (`Paroquia`, `Comunidade`).

## Goals / Non-Goals

**Goals:**
- Permitir que `SECRETARIA_CNC` cadastre e atualize comunidades apenas nas paróquias vinculadas a ele (`usuarioParoquia`), reutilizando a mesma condição CASL do escopo de leitura.
- Distinguir, de forma compatível com a API atual: **404** para recurso inexistente e **403** para recurso fora do escopo.
- Manter `ADMIN` e demais perfis inalterados.
- Cobrir a nova regra com e2e na suíte existente de comunidade.

**Non-Goals:**
- Alterar `findAll`/`findOne`/`remove` de comunidade (fora do escopo deste change).
- Alterar o schema Prisma (nenhuma migração).
- Restringir outros perfis ou outros recursos.

## Decisions

### 1. Regra de escopo de escrita centralizada no CASL (mesmo padrão do escopo de leitura)

Em `CaslAbilityService`, para `SECRETARIA_CNC`, adicionar:

```ts
can('create', 'comunidade', {
  paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } },
});
can('update', 'comunidade', {
  paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } },
});
```

**Por quê:** mantém a regra de autorização em um único lugar (CASL), seguindo exatamente o padrão do change arquivado. Alternativa descartada: checar `usuarioParoquia` manualmente no service (consulta extra e regra duplicada fora do CASL).

### 2. Aplicação do escopo no cadastro (`ComunidadeService.create`)

Após `validateCreateAbility('comunidade')`, a paróquia alvo precisa existir **e** estar dentro do escopo de `create`. A condição CASL é relativa ao modelo `comunidade` (`paroquia.is.usuarioParoquias...`); como a comunidade ainda não existe, validamos contra a paróquia:

```ts
const createScope = accessibleBy(this.abilityService.ability, 'create').comunidade;
// SECRETARIA_CNC: { paroquia: { is: { usuarioParoquias: { some: { userId } } } } } | ADMIN: {}
const condicaoParoquia = (createScope as any)?.paroquia?.is?.usuarioParoquias ?? {};

const paroquia = await this.prisma.paroquia.findFirst({
  where: { AND: [{ id: createComunidadeDto.paroquiaId }, condicaoParoquia] },
});
if (!paroquia) {
  // distingue 404 (paróquia inexistente) de 403 (fora do escopo)
  await this.prisma.paroquia.findUniqueOrThrow({ where: { id: createComunidadeDto.paroquiaId } });
  throw new ForbiddenException(
    'Você não tem permissão para cadastrar comunidade fora das suas paróquias.',
  );
}
```

- Para `ADMIN`, `accessibleBy` retorna `{}` → a paróquia é validada apenas por existência (404 preservado), como hoje.
- Para `SECRETARIA_CNC`, a projeção da condição to-one (`comunidade.paroquia`) para a paróquia é mecânica e local: `paroquia.usuarioParoquias.some.userId`.
- Alternativa considerada: manter `paroquiaService.findOne` + checagem ad-hoc de vínculo — rejeitada por duplicar a regra e misturar 404/403 no serviço.

### 3. Aplicação do escopo na atualização (`ComunidadeService.update`)

A comunidade já existe, então o escopo é aplicado diretamente no modelo `comunidade`, antes do update:

```ts
this.validateUpdateAbility('comunidade');
const comunidade = await this.prisma.comunidade.findFirst({
  where: {
    AND: [{ id }, accessibleBy(this.abilityService.ability, 'update').comunidade],
  },
});
if (!comunidade) {
  await this.prisma.comunidade.findUniqueOrThrow({ where: { id } }); // 404 se inexistente
  throw new ForbiddenException(
    'Você não tem permissão para atualizar comunidade fora das suas paróquias.',
  );
}
// ... fluxo atual de update + historico
```

- Distinção 404/403 idêntica à do cadastro: `findUniqueOrThrow` propaga `P2025` → 404; se a comunidade existe mas o escopo não casa, lança 403.
- O `UpdateComunidadeDto` não contém `paroquiaId` (conferido no DTO), então não há "troca de paróquia" a validar — basta o escopo sobre a comunidade existente.

### 4. Testes e2e em `test/comunidade.e2e-spec.ts`

Reaproveitar os usuários já provisionados na suíte (`secretaria@admin.com` → paróquia 1; `secretaria-sem-paroquia@admin.com` → nenhuma; `admin@admin.com`):
- `POST /comunidade` `SECRETARIA_CNC` na paróquia 1 (dentro do escopo, número de comunidade livre) → 201.
- `POST /comunidade` `SECRETARIA_CNC` na paróquia 2 (fora do escopo) → 403.
- `POST /comunidade` `SECRETARIA_CNC` com paroquiaId inexistente → 404.
- `POST /comunidade` `ADMIN` em paróquia arbitrária → 201 (irrestrito).
- `PATCH /comunidade/:id` `SECRETARIA_CNC` em comunidade da paróquia 1 → 200.
- `PATCH /comunidade/:id` `SECRETARIA_CNC` em comunidade da paróquia 2 → 403.
- `PATCH /comunidade/:id` com id inexistente → 404.
- Usar tokens obtidos via `POST /auth/login` (padrão da suíte).

## Risks / Trade-offs

- **Projeção da condição CASL no cadastro (`createScope.paroquia.is.usuarioParoquias`)** → Detalhe interno frágil se a condição mudar de forma. Mitigação: teste e2e cobre 403/404/201; a projeção é documentada neste design; se a condição evoluir, o teste quebra primeiro.
- **Distinção 404 vs 403 depende de ordem das consultas** → Documentada e coberta por e2e (paróquia/comunidade inexistente → 404; existente fora do escopo → 403).
- **`SECRETARIA_CNC` passa a ter escrita** → Comportamento novo e intencional; restringido ao escopo. Risco de escrita indevida em paróquia fora do escopo mitigado pela condição CASL + validação.
- **Número da comunidade único por paróquia** → Testes usam números livres do seed (a paróquia 1 do seed tem 10 comunidades); escolher número novo para evitar `P2002`.

## Migration Plan

Não aplicável — sem mudança de schema nem migração. Rollback: reverter as regras CASL e as validações em `ComunidadeService` (create/update).

## Open Questions

Nenhuma — perfil (SECRETARIA_CNC) e alcance (cadastro e atualização) confirmados. A decisão de 403 (fora do escopo) vs 404 (inexistente) segue o padrão vigente de autorização e está registrada neste design; ajustável se o domínio preferir 404 para ambos.