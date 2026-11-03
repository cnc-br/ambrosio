# Proposal

## Why

O perfil `SECRETARIA_CNC` hoje só possui `read` sobre `pessoa`, o que o impede de cadastrar e atualizar pessoas pela API. A regra CASL foi estendida localmente (ainda não commitada) com `can('create', 'pessoa')` em `src/casl/casl-ability/casl-ability.service.ts`, mas não existe nenhum teste que comprove que o perfil realmente consegue criar pessoa nem que os demais perfis continuam bloqueados. Além disso, `PessoaService.update` não valida permissão alguma: o `PATCH /pessoa/:id` está aberto a qualquer usuário autenticado, então conceder `update` ao `SECRETARIA_CNC` exige também aplicar a validação no serviço. Sem cobertura, as permissões podem ser removidas ou quebradas sem que ninguém perceba.

## What Changes

- Formaliza na spec o comportamento já implementado em `src/casl/casl-ability/casl-ability.service.ts`: o perfil `SECRETARIA_CNC` pode criar pessoa (`POST /pessoa`).
- Adiciona ao perfil `SECRETARIA_CNC` a permissão `update` sobre `pessoa` e passa a aplicar `validateUpdateAbility('pessoa')` em `PessoaService.update`, de modo que `PATCH /pessoa/:id` seja autorizado apenas para `ADMIN` e `SECRETARIA_CNC` e rejeite os demais perfis com 403.
- Adiciona casos e2e em `test/pessoa/pessoa-create.e2e-spec.ts` cobrindo o `SECRETARIA_CNC` autenticado criando pessoa (201) e atualizando pessoa (200), conferindo os campos retornados.
- Mantém os casos existentes de 401 (sem token) e 403 (perfil sem permissão) para criação e adiciona os equivalentes para atualização, garantindo que as novas permissões não abrem as rotas para todos os perfis.
- Adiciona asserções unitárias em `src/casl/casl-ability/casl-ability.service.spec.ts` de que o `SECRETARIA_CNC` tem `create` e `update` sobre `pessoa`, e um teste de serviço confirmando o 403 na atualização sem permissão.
- Documenta o efeito colateral conhecido: como `POST /pessoa/:id/contato` reutiliza a permissão `create` sobre `pessoa`, o `SECRETARIA_CNC` passa a poder criar contatos de pessoa. Nenhuma mudança adicional de código é necessária para isso.

## Capabilities

### New Capabilities
- `pessoa`: Gestão do cadastro e da atualização de pessoas via `POST /pessoa` e `PATCH /pessoa/:id`, incluindo o contrato de criação/atualização, a autorização por perfil (quem pode criar/atualizar e quem é bloqueado) e as respostas de sucesso.

### Modified Capabilities
<!-- Nenhuma: criar contato já exige `create` sobre `pessoa` na spec `pessoa-contato`; o efeito colateral é consequência dessa regra e está registrado em Impact. A spec `testes-e2e` já cobre o padrão de 401/403/sucesso. -->

## Impact

- **Código**:
  - `src/casl/casl-ability/casl-ability.service.ts` — linhas `can('create', 'pessoa')` e `can('update', 'pessoa')` no perfil `SECRETARIA_CNC`.
  - `src/pessoa/pessoa.service.ts` — `PessoaService.update` passa a chamar `validateUpdateAbility('pessoa')` antes de buscar/atualizar.
- **Testes**:
  - `test/pessoa/pessoa-create.e2e-spec.ts` — casos de sucesso com `secretaria@admin.com` (seed, role `SECRETARIA_CNC`) para criação (201) e atualização (200), além de 401/403/404.
  - `src/casl/casl-ability/casl-ability.service.spec.ts` — asserções das permissões `create` e `update` de pessoa para `SECRETARIA_CNC` e negativas para `NAO_IDENTIFICADO`.
  - `src/pessoa/pessoa.service.spec.ts` — teste de que a atualização sem permissão lança 403 antes de tocar no banco.
- **API**: `POST /pessoa` passa a responder 201 para `SECRETARIA_CNC`; `PATCH /pessoa/:id` passa a responder 200 para `ADMIN`/`SECRETARIA_CNC` e 403 para os demais perfis autenticados (mudança de comportamento: antes o endpoint não validava permissão). `POST /pessoa/:id/contato` também passa a aceitar `SECRETARIA_CNC` por reutilizar a permissão `create pessoa`.
- **Banco**: nenhuma alteração de schema ou migração.
- **Dependências**: nenhuma nova.
