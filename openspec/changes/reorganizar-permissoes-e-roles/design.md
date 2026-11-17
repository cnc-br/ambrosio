# Design

## Context

Ver `proposal.md` — Why. Hoje as permissões vivem em um único mapa `rolePermissionsMap` em `src/casl/casl-ability/casl-ability.service.ts`, com funções inline por papel. O `SECRETARIA_CNC` é o único perfil de secretaria com regras e usa `usuarioParoquia` para recortar leitura/escrita de comunidade, etapa e atualização de pessoa. `paroquia` já tem `setorId`, mas não existe vínculo entre usuário e setor. Os serviços aplicam o escopo de duas formas: `accessibleBy(ability, 'read')` em listagens e `validate*Ability` (que avalia apenas ação + recurso) para escrita.

## Goals / Non-Goals

**Goals:**
- Mover o comportamento local atual do `SECRETARIA_CNC` para o `SECRETARIA_PAROQUIA` sem alterar capacidades.
- Dar ao `SECRETARIA_CNC` a mesma base de capacidades com escopo por setor, mais `create`/`update`/`delete` de paróquia e de diocese.
- Tornar a inclusão de uma nova permissão de secretaria uma edição em um único ponto.
- Persistir e gerenciar o vínculo usuário–setor.

**Non-Goals:**
- Redesenhar a autorização de perfis de catequese (`CATEQUISTA_*`).
- Alterar o contrato de `PATCH /users/:id/paroquias`.
- Criar UI para gestão de setores.
- Unificar `usuarioParoquia` e `usuarioSetor` em um único modelo.

## Decisions

### 1. `usuarioSetor` como vínculo próprio, não derivado de `usuarioParoquia`

Criar o modelo `usuarioSetor` (`userId`, `setorId`, `@@unique([userId, setorId])`, `onDelete: Cascade` nos dois lados) em vez de derivar setores das paróquias do usuário.

**Por quê:** o requisito é conceder setores diretamente (rota `PATCH /users/:id/setores`), inclusive a um usuário que não tenha paróquias individuais. Derivar de `usuarioParoquia` impediria conceder um setor sem antes conceder todas as suas paróquias e criaria acoplamento entre dois conceitos de escopo.

**Alternativas:** derivar `setor` a partir de `usuarioParoquia` (rejeitado: não atende à rota pedida e mistura escopos); usar apenas `setorId` em `user` (rejeitado: um usuário pode responder por mais de um setor).

### 2. Permissões declarativas com bundle compartilhado e estratégia de escopo

Substituir as funções inline por regras declarativas:

```ts
type PermissionRule = {
  action: PermActions;
  subject: PermissionResource;
  conditions?: PrismaQuery;
};

type EscopoSecretaria = {
  paroquia: PrismaQuery;
  comunidade: PrismaQuery;
  etapa: PrismaQuery;
  pessoaUpdate: PrismaQuery;
};

const permissoesSecretaria = (escopo: EscopoSecretaria): PermissionRule[] => [
  // base compartilhada: pessoa, diocese, estadoCivil, carisma, localidade,
  // paroquia (read), comunidade (read/create/update), etapa (create/update)
];

const escopoPorParoquia = (user): EscopoSecretaria => ({ ... });
const escopoPorSetor = (user): EscopoSecretaria => ({ ... });
```

`rolePermissionsMap` passa a mapear cada papel para uma função que aplica regras:

```ts
SECRETARIA_PAROQUIA: (user, b) =>
  aplicar(b, permissoesSecretaria(escopoPorParoquia(user))),
SECRETARIA_CNC: (user, b) => {
  const escopo = escopoPorSetor(user);
  aplicar(b, permissoesSecretaria(escopo));
  aplicar(b, [
    { action: 'create', subject: 'diocese' },
    { action: 'update', subject: 'diocese' },
    { action: 'delete', subject: 'diocese' },
    { action: 'create', subject: 'paroquia' },
    { action: 'update', subject: 'paroquia', conditions: escopo.paroquia },
    { action: 'delete', subject: 'paroquia', conditions: escopo.paroquia },
  ]);
},
```

**Por quê:** uma capacidade nova entra em `permissoesSecretaria` uma vez e vale para os dois perfis com o escopo correto; a diferença entre eles fica explícita apenas no que é exclusivo.

**Alternativas:** manter duas funções completas por papel (rejeitado: volta a duplicar regras); herdar o mapa do `SECRETARIA_PAROQUIA` literalmente (rejeitado: o escopo do `SECRETARIA_CNC` é por setor, não por paróquia).

### 3. Condições de escopo derivadas de uma única projeção

Definir a condição de paróquia uma vez e derivar as demais, em vez de repetir o aninhamento em cada regra:

```ts
const paroquiaDoUsuario = (user) =>
  ({ usuarioParoquias: { some: { userId: user.id } } });

const paroquiaDoSetor = (user) =>
  ({ setor: { is: { usuarioSetores: { some: { userId: user.id } } } } });

const comunidadeDe = (paroquia) => ({ paroquia: { is: paroquia } });
const etapaDe = (paroquia) => ({ comunidade: { is: comunidadeDe(paroquia) } });
```

`pessoaUpdate` mantém a forma atual (`OR` entre "sem vínculo ativo" e "vínculo ativo em paróquia do escopo"), trocando apenas a condição de paróquia pela projeção do perfil.

**Por quê:** o aninhamento `comunidade.paroquia.setor.usuarioSetores` é extenso e fácil de errar; uma projeção única reduz divergência entre regras.

### 4. Escopo de escrita de paróquia validado no serviço

`validateCreateAbility`/`validateDeleteAbility` avaliam apenas ação + recurso (a condição CASL não é aplicada a uma string). Portanto:

- `ParoquiaService.create`: após resolver o setor, validar que `setor.id` pertence ao usuário quando o perfil for `SECRETARIA_CNC`; caso contrário, 403.
- `ParoquiaService.update`: `findOne` já usa `accessibleBy(ability, 'read').paroquia` (escopo por setor), então a paróquia fora do escopo não é encontrada/autorizada. Se o payload trouxer `setor`, validar que o setor de destino também está no escopo.
- `ParoquiaService.remove`: passar a buscar a paróquia pelo mesmo `accessibleBy` antes de excluir, para que `SECRETARIA_CNC` não exclua paróquia de setor alheio.

**Alternativas:** alterar a assinatura de `validateCreateAbility` para aceitar um objeto (rejeitado neste change: impacto em todos os serviços e o create de paróquia ainda precisaria resolver o setor antes).

### 5. Migração de dados dos usuários `SECRETARIA_CNC` existentes

Como o comportamento local passa a ser `SECRETARIA_PAROQUIA`, a migration deve converter os usuários hoje marcados como `SECRETARIA_CNC` para `SECRETARIA_PAROQUIA`. Sem isso, usuários existentes ganhariam, sem intenção, gestão nacional de paróquias.

**Alternativas:** não migrar e pedir reatribuição manual (rejeitado: risco de escalada de privilégio silenciosa).

## Risks / Trade-offs

- **[Escalada de privilégio na virada]** → Migração de dados converte `SECRETARIA_CNC` existente em `SECRETARIA_PAROQUIA`; o novo `SECRETARIA_CNC` é atribuído explicitamente.
- **[Criação de paróquia sem condição CASL]** → Validação explícita do `setorId` no serviço, coberta por e2e de 403.
- **[Exclusão de paróquia fora do escopo]** → `remove` passa a buscar a paróquia com o mesmo escopo de leitura antes de excluir.
- **[Duplicação de vínculos]** → `@@unique([userId, setorId])` em `usuarioSetor` e transação de substituição que apaga e recria os vínculos.
- **[Testes existentes usam `SECRETARIA_CNC` como secretaria local]** → Renomear fixtures para `SECRETARIA_PAROQUIA` e adicionar uma fixture `SECRETARIA_CNC` com `usuarioSetor`.
- **[Movimentação de paróquia entre setores]** → Validar o setor de destino em `update`; sem isso, o usuário poderia tirar a paróquia do próprio escopo ou trazê-la de outro.

## Migration Plan

1. Criar modelo `usuarioSetor` e migration Prisma com a tabela, a unicidade e os `onDelete: Cascade`.
2. Na mesma migration, executar `UPDATE "user" SET role = 'SECRETARIA_PAROQUIA' WHERE role = 'SECRETARIA_CNC';`.
3. Implantar o código refatorado e os novos testes.
4. Atualizar o seed: `secretaria@admin.com` vira `SECRETARIA_PAROQUIA` (mantém vínculo com a paróquia 1) e criar `secretaria-cnc@admin.com` como `SECRETARIA_CNC` vinculado ao setor da paróquia 1.
5. Rollback: reverter a migration (`DROP TABLE "usuarioSetor"`) e restaurar o mapa de permissões anterior; a conversão de papéis pode ser revertida com `UPDATE ... WHERE role = 'SECRETARIA_PAROQUIA' AND ...` apenas para os usuários identificados no deploy.
