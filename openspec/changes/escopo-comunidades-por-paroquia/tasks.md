# Tasks

## 1. Regra de escopo no CASL

- [x] 1.1 Em `src/casl/casl-ability/casl-ability.service.ts`, alterar a permissão de `read` de `comunidade` do `SECRETARIA_CNC` para usar a condição `paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } }`; verificar com `npm run lint` que não há erro
- [x] 1.2 Adicionar caso em `src/casl/casl-ability/casl-ability.service.spec.ts` que, para um usuário `SECRETARIA_CNC`, confirme via `accessibleBy(ability, 'read').comunidade` que o filtro referencia a paróquia vinculada ao usuário; verificar com `npm test`

## 2. Filtro na listagem de comunidades

- [x] 2.1 Em `src/comunidade/comunidade.service.ts`, no `findAll`, combinar `accessibleBy(this.abilityService.ability, 'read').comunidade` com os filtros `paroquiaId`/`numeroDaComunidade` usando `AND`; verificar com `npm run lint`
- [x] 2.2 Adicionar caso em `src/comunidade/comunidade.service.spec.ts` (com `PrismaService` mockado) que confirme que `findAll` inclui o filtro de escopo no `where` enviado ao Prisma; verificar com `npm test`

## 3. Dados de teste (seed)

- [x] 3.1 Adicionar em `prisma/seed.ts` um usuário `SECRETARIA_CNC` (ex.: `secretaria@admin.com` / `admin`) vinculado via `usuarioParoquia` à paróquia 1; verificar com `npm run seed` que o seed conclui e que o vínculo é criado

## 4. Testes e2e e verificação de integração

- [x] 4.1 Criar `test/comunidade.e2e-spec.ts` no padrão da spec `testes-e2e`, cobrindo: `SECRETARIA_CNC` vê só comunidades das suas paróquias; `ADMIN` vê todas; usuário sem vínculo vê lista vazia; `paroquiaId` fora do escopo vê lista vazia; verificar com `npm run test:e2e`
- [x] 4.2 Rodar `npm test` e `npm run test:e2e` completos e confirmar que a nova suíte passa sem regressões nas existentes

## Workflow follow-up

- Arquivar a mudança após a revisão do projeto.
- Verificar o resultado arquivado.
