# Tasks

## 1. Permissões CASL de escrita escopadas

- [x] 1.1 Em `src/casl/casl-ability/casl-ability.service.ts`, para o perfil `SECRETARIA_CNC`, adicionar `can('create', 'comunidade', { paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } } })` e `can('update', 'comunidade', { paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } } })`; verificar com `npm run build` e com o teste unitário de CASL (`npm run test -- src/casl/casl-ability`) se houver cobertura do mapa de permissões

## 2. Validação de escopo no service de comunidade

- [x] 2.1 Em `ComunidadeService.create`, após `validateCreateAbility('comunidade')`, validar a paróquia alvo dentro do escopo de create: obter `accessibleBy(this.abilityService.ability, 'create').comunidade`, projetar a condição sobre `paroquia` (`usuarioParoquias` quando houver condição — `{}` para ADMIN) e buscar `prisma.paroquia.findFirst({ where: { AND: [{ id: paroquiaId }, condição] } })`; se não encontrar, confirmar a existência com `findUniqueOrThrow` (→ 404) e senão lançar `ForbiddenException` (→ 403); verificar com `npm run build`
- [x] 2.2 Em `ComunidadeService.update`, após `validateUpdateAbility('comunidade')`, buscar a comunidade com `prisma.comunidade.findFirst({ where: { AND: [{ id }, accessibleBy(this.abilityService.ability, 'update').comunidade] } })`; se não encontrar, confirmar a existência com `findUniqueOrThrow` (→ 404) e senão lançar `ForbiddenException` (→ 403), antes do fluxo atual de update/histórico; verificar com `npm run build`

## 3. Testes e2e

- [x] 3.1 Adicionar em `test/comunidade.e2e-spec.ts` o caso `POST /comunidade` do `SECRETARIA_CNC` (token `secretaria@admin.com`) em paróquia própria (id 1, número de comunidade livre ex.: 11) → espera 201 com `data.id` e `data.paroquia.id` 1
- [x] 3.2 Adicionar o caso `POST /comunidade` do `SECRETARIA_CNC` em paróquia fora do escopo (id 2) → espera 403 com `error` `Forbidden` e `statusCode` 403
- [x] 3.3 Adicionar o caso `POST /comunidade` do `SECRETARIA_CNC` com `paroquiaId` inexistente → espera 404 com `message` `O registro de 'Paroquia' não foi encontrado.`
- [x] 3.4 Adicionar `PATCH /comunidade/:id` do `SECRETARIA_CNC`: comunidade da paróquia 1 → espera 200; comunidade da paróquia 2 → espera 403; id inexistente → espera 404 (`O registro de 'Comunidade' não foi encontrado.`)
- [x] 3.5 Adicionar casos de `ADMIN` irrestrito: `POST /comunidade` em paróquia arbitrária → espera 201; `PATCH /comunidade/:id` de paróquia arbitrária → espera 200
- [x] 3.6 Executar a suíte e2e com `npm run test:e2e` e verificar que todos os casos de `test/comunidade.e2e-spec.ts` (e demais suítes) passam

## 4. Correção: escopo de atualização nas operações de vínculo de pessoa

- [x] 4.1 Aplicar a validação de escopo de atualização (`validarComunidadeDentroDoEscopoDeAtualizacao`) em `ComunidadeService.adicionarPessoa` e `ComunidadeService.removerPessoa` (antes, apenas `validateUpdateAbility`, permitindo vínculos em comunidades de outras paróquias); verificar com `npm run build`
- [x] 4.2 Adicionar em `test/comunidade.e2e-spec.ts` casos de regressão do furo: `POST /comunidade/:id/pessoa/:pessoaId` do `SECRETARIA_CNC` em comunidade da paróquia 1 → espera 201; em comunidade da paróquia 2 → espera 403; `DELETE /comunidade/:id/pessoa/:pessoaId` em comunidade da paróquia 2 → espera 403
- [x] 4.3 Executar a suíte e2e completa (`npm run test:e2e`) e verificar que todos os casos passam

## Workflow follow-up

- Após revisão do change, arquivar com o fluxo de archive do OpenSpec.
- Verificar o resultado arquivado (delta `escopo-acesso-paroquia` sincronizada com a spec principal).