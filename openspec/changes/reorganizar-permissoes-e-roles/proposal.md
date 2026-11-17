# Proposal

## Why

O perfil `SECRETARIA_CNC` acumula hoje responsabilidades de secretaria de paróquia: seu acesso é recortado pelas paróquias vinculadas em `usuarioParoquia` e as specs usam esse perfil para descrever o trabalho local. Ao mesmo tempo, não existe um perfil nacional de secretaria que enxergue todas as paróquias de um setor e administre paróquias. Isso embaralha o domínio e torna arriscado ampliar permissões, porque a regra de cada perfil está codificada em um único mapa monolítico de `rolePermissionsMap`.

## What Changes

- **Renomeia o papel atual**: tudo que hoje é comportamento do `SECRETARIA_CNC` (escopo por paróquia via `usuarioParoquia`) passa a ser do `SECRETARIA_PAROQUIA`, sem ganho nem perda de capacidades.
- **Reposiciona o `SECRETARIA_CNC`**: passa a ser o perfil nacional de secretaria, com todas as capacidades do `SECRETARIA_PAROQUIA` **e** permissões de `create`, `update` e `delete` sobre `paroquia` e sobre `diocese` (**BREAKING** para usuários que hoje têm `SECRETARIA_CNC` e esperam acesso restrito a paróquias).
- **Escopo por setor para o `SECRETARIA_CNC`**: cada paróquia pertence a um `setor`; o `SECRETARIA_CNC` acessa apenas as paróquias cujos setores estão vinculados a ele.
- **Novo vínculo usuário–setor**: modelo `usuarioSetor`, migration versionada e rota `PATCH /users/:id/setores` para substituir os setores de um usuário, no mesmo padrão da rota existente `PATCH /users/:id/paroquias`.
- **Refatora o mapa de permissões**: regras passam a ser declarativas e compostas por *bundles* reutilizáveis e por uma estratégia de escopo (paróquia ou setor), de modo que uma nova permissão seja adicionada em um único lugar e valha para os dois perfis que compartilham a base de secretaria.
- **Atualiza specs e documentação**: as specs principais e o glossário de papéis (`AGENTS.md`) passam a usar `SECRETARIA_PAROQUIA` para o escopo local e a descrever o novo `SECRETARIA_CNC`.

## Capabilities

### New Capabilities

- `permissoes`: modelo declarativo de papéis e permissões, com bundles reutilizáveis e estratégias de escopo (paróquia e setor), definindo como novas permissões são adicionadas.

### Modified Capabilities

- `escopo-acesso-paroquia`: o escopo local de comunidades/etapas/pessoas deixa de citar `SECRETARIA_CNC` e passa a citar `SECRETARIA_PAROQUIA`; acrescenta o escopo por setor do `SECRETARIA_CNC`.
- `paroquia`: o `SECRETARIA_CNC` passa a poder criar, editar e excluir paróquias, restrito aos setores vinculados a ele.
- `pessoa`: criação, atualização, casal e cônjuges passam a citar `SECRETARIA_PAROQUIA` no escopo local; o `SECRETARIA_CNC` mantém as mesmas capacidades com escopo por setor.
- `pessoa-contato`: criação e atualização de contato passam a citar `SECRETARIA_PAROQUIA` no escopo por paróquia.
- `carisma`: atualização de carismas de pessoa passa a citar `SECRETARIA_PAROQUIA` no escopo por paróquia.
- `usuario`: novo requisito de vínculo usuário–setor e da rota `PATCH /users/:id/setores`.

## Impact

- **Código**: `src/casl/casl-ability/casl-ability.service.ts` (refatoração do mapa), `src/paroquia/paroquia.service.ts` (escopo de create/update/delete por setor), `src/users/users.controller.ts` e `src/users/users.service.ts` (rota de setores), novos DTOs e arquivos de permissões.
- **Banco**: novo modelo `usuarioSetor` e migration Prisma; seed ganha usuário `SECRETARIA_CNC` vinculado a setor e `SECRETARIA_PAROQUIA` vinculado a paróquia para os testes.
- **API**: nova rota `PATCH /users/:id/setores`; `POST/PATCH/DELETE /paroquia` passam a aceitar `SECRETARIA_CNC` dentro do escopo de setor.
- **Testes**: atualização dos e2e e unitários que usam `SECRETARIA_CNC` como secretaria local; novos casos para o escopo por setor e para a rota de setores.
- **Documentação**: `AGENTS.md` e specs principais.
