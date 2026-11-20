# Design

## Context

Ver `proposal.md` — Why e `specs/` para o comportamento exigido. Hoje o escopo do `SECRETARIA_CNC` é projetado em `src/casl/casl-ability/casl-ability.service.ts` por `paroquia.setor.usuarioSetores`, e `ParoquiaService` valida escrita consultando `usuarioSetor`. O vínculo é gerenciado por `PATCH /users/:id/setores` em `UsersService.adicionarSetoresAoUsuario`. A hierarquia do mapa é `macroRegiao → regiao → setor → paroquia`, então uma região alcança todos os setores e paróquias abaixo dela. `usuarioSetor` é uma tabela de vínculo simples, sem auditoria, criada na change anterior `reorganizar-permissoes-e-roles`.

## Goals / Non-Goals

**Goals:**
- Trocar a granularidade do vínculo do `SECRETARIA_CNC` de setor para região, sem manter dois escopos em paralelo.
- Preservar o comportamento do `SECRETARIA_PAROQUIA` por `usuarioParoquia`.
- Migrar os vínculos existentes de forma determinística, sem perder acesso.
- Manter a projeção de escopo em um único ponto para que todos os serviços que usam CASL herdem a mudança.

**Non-Goals:**
- Alterar a hierarquia do mapa ou as rotas de macro-região/região/setor.
- Unificar `usuarioParoquia` e `usuarioRegiao` em um modelo único.
- Criar UI de gestão de regiões neste repositório.
- Redesenhar permissões de perfis de catequese.

## Decisions

### 1. `usuarioRegiao` substitui `usuarioSetor`

Criar `usuarioRegiao` (`userId`, `regiaoId`, `@@unique([userId, regiaoId])`, `onDelete: Cascade` nos dois lados) e remover `usuarioSetor` do schema. A migration cria a tabela, copia os vínculos existentes com:

```sql
INSERT INTO "usuarioRegiao" ("userId", "regiaoId")
SELECT DISTINCT us."userId", s."regiaoId"
FROM "usuarioSetor" us
JOIN "setor" s ON s."id" = us."setorId"
ON CONFLICT DO NOTHING;
```

e só então remove `usuarioSetor`.

**Por quê:** a região é a unidade operacional pedida; manter as duas tabelas criaria dois escopos concorrentes e respostas ambíguas para "quais paróquias este usuário enxerga". A cópia por `setor.regiaoId` preserva o acesso existente, ampliando-o de setor para a região — que é a intenção da mudança.

**Alternativas:** manter `usuarioSetor` e somar as regiões (rejeitado: dois caminhos para a mesma decisão e risco de divergência); derivar regiões de `usuarioParoquia` (rejeitado: exigiria vincular todas as paróquias uma a uma e misturar os dois escopos).

### 2. Projeção única de paróquia por região

Substituir `paroquiaDoSetor` por:

```ts
const paroquiaDaRegiao = (user: SecretariaUser): PrismaQuery => ({
  setor: {
    is: {
      regiao: {
        is: { usuarioRegioes: { some: { userId: user.id } } },
      },
    },
  },
});
```

e usar `escopoPorRegiao(user)` no lugar de `escopoPorSetor(user)` em `rolePermissionsMap.SECRETARIA_CNC`. As demais condições (`comunidadeDe`, `etapaDe`, `pessoaUpdateDe`) continuam derivando dessa projeção, então comunidade, etapa, pessoa, casal, contato e carismas passam a respeitar a região sem alteração individual.

**Por quê:** uma única árvore de condições evita repetir `setor.regiao.usuarioRegioes` em cada regra e garante que listagem e escrita usem o mesmo recorte.

**Alternativas:** criar uma condição por recurso (rejeitado: duplicação e divergência); filtrar em memória após buscar tudo (rejeitado: custo e vazamento de dados).

### 3. Validação explícita da região na escrita de paróquia

Em `ParoquiaService`, trocar `validarSetorNoEscopoDoUsuario` por `validarRegiaoNoEscopoDoUsuario(setorId)`, consultando se o setor de destino pertence a uma região do usuário:

```ts
const vinculo = await this.prisma.setor.findFirst({
  where: {
    id: setorId,
    regiao: { usuarioRegioes: { some: { userId } } },
  },
  select: { id: true },
});
```

Se não houver vínculo, distinguir 404 (setor inexistente) de 403 (setor existente fora das regiões), como já ocorre hoje. A mensagem de 403 passa a citar "fora das suas regiões". `create`, `update` (quando o payload traz `setor`) e `remove` usam a mesma validação, e `ADMIN` continua isento por `manage all`.

**Por quê:** `validateCreateAbility`/`validateDeleteAbility` avaliam apenas ação e recurso, sem aplicar a condição CASL a um objeto; a checagem precisa ser explícita para impedir escrita em setor de outra região.

**Alternativas:** confiar apenas em `accessibleBy` no `remove` e não validar no `create` (rejeitado: abriria escrita fora do escopo).

### 4. Rota renomeada e DTO próprio

Renomear `adicionarSetoresAoUsuario` para `adicionarRegioesAoUsuario`, criar `AdicionarRegioesAoUsuarioDto` com `regiaoIds` e expor `PATCH /users/:id/regioes`. O serviço continua transacional: valida o usuário, valida que todas as regiões existem (404 com os ids faltantes), apaga os vínculos e recria a lista informada; lista vazia remove tudo.

**Por quê:** manter `/setores` apontando para regiões confundiria o contrato. A rota nova é explícita e o DTO replica o padrão de `adicionarParoquiasAoUsuario`.

**Alternativas:** aceitar `regiaoIds` em `/setores` (rejeitado: contrato enganoso); aceitar as duas rotas (rejeitado: dívida desnecessária).

### 5. Exposição de `regioes` no detalhe do usuário

Incluir `usuarioRegioes { regiao }` no `findOne` e serializar `regioes` ao lado de `paroquias`, sempre como lista (vazia quando não houver vínculos). O tipo de resposta é uma extensão local de `User` (`User & { regioes: ... }`), sem alterar o pacote `neocatecumenal`.

**Por quê:** sem esse campo o `ADMIN` não consegue ver o que já está atribuído ao usuário antes de substituir a lista.

**Alternativas:** criar `GET /users/:id/regioes` separado (rejeitado: mais uma chamada para a mesma tela); não expor (rejeitado: torna a gestão cega).

### 6. Seed e e2e por região

No seed, vincular `secretaria-cnc@admin.com` à região do setor da paróquia 1 (`primeiraParoquia.setor.regiaoId`). No e2e de escopo, renomear o arquivo para `secretaria-cnc-regiao.e2e-spec.ts` e montar duas regiões distintas: a do usuário e outra, cada uma com setor e paróquia próprios, garantindo que a paróquia "de fora" não pertença à região do usuário.

**Por quê:** o e2e atual cria a segunda paróquia no setor 2; se o setor 2 estiver na mesma região do setor 1, o teste não prova o recorte. A massa precisa controlar a região explicitamente.

## Risks / Trade-offs

- **[Breaking change para clientes da API]** → `PATCH /users/:id/setores` deixa de existir. Mitigação: anunciar a versão, atualizar o frontend no mesmo ciclo e manter o DTO/rota antigos fora do código após a migração, sem período de dupla escrita.
- **[Ampliação de acesso na migração]** → usuários vinculados a um setor passam a enxergar toda a região. É o comportamento desejado, mas deve ser comunicado; auditar os vínculos antes do deploy.
- **[Perda de granularidade de setor]** → a região não distingue dois setores. Mitigação: se no futuro for necessário voltar ao setor, a migration inversa pode recriar `usuarioSetor` a partir das paróquias ou de backup.
- **[Regiões sem vínculo]** → usuários `SECRETARIA_CNC` sem `usuarioRegiao` ficam sem acesso a comunidades/paróquias. Mitigação: validar a lista de usuários antes do deploy e cobrir o cenário de lista vazia nos testes.
- **[Ordem da migration]** → se `usuarioSetor` for removida antes da cópia, os vínculos se perdem. Mitigação: migration única com `CREATE`, `INSERT ... SELECT`, `DROP` nessa ordem, revisada em `prisma migrate dev` e testada com dados de seed.

## Migration Plan

1. Criar a migration com `usuarioRegiao`, copiar os vínculos e remover `usuarioSetor` (SQL acima); rodar `npx prisma migrate dev` e `npx prisma validate`.
2. Ajustar seed para criar o usuário `SECRETARIA_CNC` vinculado à região; rodar `npm run seed`.
3. Implantar o backend e o frontend juntos, por causa da rota renomeada.
4. Rollback: restaurar o backup do banco (ou recriar `usuarioSetor` a partir da região e dos setores) e reverter a versão da aplicação; a rota antiga só volta com o código anterior.

## Open Questions

Nenhuma no momento.
