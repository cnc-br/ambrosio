# Proposal

## Why

Hoje macro-regiões, regiões e setores só expõem leitura pública: não existe forma de cadastrar ou atualizar a hierarquia territorial pela API, o que impede a secretaria nacional de manter a estrutura sem intervenção manual no banco.

## What Changes

- **Sem módulo agregador**: `MacroRegiaoModule`, `RegiaoModule` e `SetorModule` continuam independentes e importados diretamente pelo `AppModule`, como hoje. Não há `MapaModule`, rota `/mapa` nem tabela `mapa`.
- **Rotas preservadas**: os endpoints de leitura continuam em `/macro-regiao`, `/regiao` e `/setor`, públicos como hoje.
- **Cadastro e atualização de macro-região**: `POST /macro-regiao` e `PATCH /macro-regiao/:id` com `descricao` e `ativo`.
- **Cadastro e atualização de região**: `POST /regiao` e `PATCH /regiao/:id`, exigindo uma macro-região existente e permitindo mover a região de macro-região no update.
- **Cadastro e atualização de setor**: `POST /setor` e `PATCH /setor/:id`, exigindo uma região existente e permitindo mover o setor de região no update.
- **Autorização de escrita**: as rotas de escrita exigem `AuthGuard` + `RoleGuard` e ficam restritas a `ADMIN` e `SECRETARIA_CNC`; leitura permanece pública. As capacidades CASL `create`/`update` de `macroRegiao`, `regiao` e `setor` passam a existir para esses perfis.
- **Auditoria obrigatória**: criação grava `cadastradoPorId` e `atualizadoPorId`; atualização grava `atualizadoPorId`, sempre a partir de `@CurrentUser('id')`, nunca do payload. Os campos de auditoria não aparecem nas respostas.

## Capabilities

### New Capabilities

- `mapa`: contrato de criação/atualização de macro-região, região e setor, incluindo validação de hierarquia, autorização e auditoria.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisito alterado. -->

## Impact

- **Código**: controllers, services, DTOs e módulos de `src/mapa/macro-regiao`, `src/mapa/regiao` e `src/mapa/setor` (os módulos ganham imports/exports para validar a hierarquia); `src/casl/casl-ability/casl-ability.service.ts` (novos subjects e permissões de `SECRETARIA_CNC`). `src/app.module.ts` não muda.
- **API**: novas rotas `POST/PATCH` de `/macro-regiao`, `/regiao` e `/setor`; leitura inalterada.
- **Banco**: nenhuma alteração de schema ou migration; os models já possuem os campos de auditoria.
- **Testes**: novos unitários de services/controllers e e2e das rotas de escrita, cobrindo 401, 403, 400, 404, 201 e 200.
- **Documentação**: nenhuma mudança necessária; `CLAUDE.md` já descreve `mapa` como o agrupamento de `setor`, `regiao` e `macro-regiao`.
