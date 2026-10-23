# Proposal

## Why

Na proposta `2026-10-21-escopo-comunidades-por-paroquia` (spec `escopo-acesso-paroquia`), o acesso de leitura de comunidade do perfil `SECRETARIA_CNC` foi restrito às paróquias vinculadas a ele em `usuarioParoquia`. Porém o mesmo recorte não vale para escrita: o `SECRETARIA_CNC` hoje não consegue cadastrar comunidade (só `ADMIN` tem `create`), e, quando um perfil tiver permissão de escrita, não há garantia de que ele atue apenas nas suas paróquias. Este change estende o escopo de paróquia para o **cadastro e a atualização** de comunidades.

## What Changes

- Concede ao perfil `SECRETARIA_CNC` as permissões `create` e `update` sobre `comunidade`, **condicionadas às paróquias vinculadas a ele** em `usuarioParoquia` (mesma condição do escopo de leitura já existente).
- Aplica o escopo no cadastro (`POST /comunidade`): o `paroquiaId` do payload precisa estar entre as paróquias do usuário; caso contrário o sistema responde **403 Forbidden**. Paróquia inexistente continua respondendo **404** como hoje.
- Aplica o escopo na atualização (`PATCH /comunidade/:id`): o usuário só consegue atualizar comunidades cuja paróquia esteja entre as suas; fora do escopo → **403**. Comunidade inexistente continua **404**.
- `ADMIN` mantém comportamento inalterado (cria/atualiza em qualquer paróquia).
- Adiciona casos e2e em `test/comunidade.e2e-spec.ts` (a suíte já provisiona usuário `SECRETARIA_CNC` vinculado à paróquia 1).
- Alteração de comportamento para `SECRETARIA_CNC` (ganha escrita, restrita às suas paróquias); sem quebra para `ADMIN`.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova: a restrição por paróquia já é representada pela capacidade existente `escopo-acesso-paroquia`, que passa a cobrir escrita. -->

### Modified Capabilities
- `escopo-acesso-paroquia`: os requisitos passam a cobrir também o cadastro e a atualização de comunidades — `SECRETARIA_CNC` pode criar/atualizar somente em paróquias vinculadas a ele (403 fora do escopo; 404 para recurso inexistente), e `ADMIN` permanece irrestrito.

## Impact

- **Código**:
  - `src/casl/casl-ability/casl-ability.service.ts` — adicionar `can('create'|'update', 'comunidade', { paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } } })` ao perfil `SECRETARIA_CNC`.
  - `src/comunidade/comunidade.service.ts` — validar o escopo de paróquia em `create` (paróquia alvo dentro do escopo) e em `update` (comunidade dentro do escopo), distinguindo 404 de 403.
- **Testes**: novos casos e2e em `test/comunidade.e2e-spec.ts` cobrindo `SECRETARIA_CNC` (cadastro/atualização na própria paróquia → sucesso; em paróquia fora → 403; recurso inexistente → 404) e `ADMIN` (irrestrito).
- **Banco**: nenhuma alteração de schema/migração — `usuarioParoquia` e `comunidade.paroquiaId` já existem.
- **API**: `POST /comunidade` e `PATCH /comunidade/:id` passam a restringir `SECRETARIA_CNC` ao escopo; contratos de resposta inalterados (201/200, 400, 401, 403, 404).