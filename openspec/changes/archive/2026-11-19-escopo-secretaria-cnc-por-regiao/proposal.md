# Proposal

## Why

O `SECRETARIA_CNC` está recortado por setor, mas a operação da secretaria nacional acontece por região: cada região reúne vários setores e, portanto, todas as paróquias desses setores. Hoje o `ADMIN` não consegue conceder uma região inteira a um usuário — precisa marcar setor a setor — e o escopo de permissões não acompanha a hierarquia do mapa (`macroRegião → região → setor → paróquia`).

## What Changes

- **Substitui o vínculo por setor pelo vínculo por região**: cria o modelo `usuarioRegiao` e remove `usuarioSetor` (**BREAKING**), migrando os vínculos existentes para a região de cada setor.
- **Troca a rota de gestão**: `PATCH /users/:id/setores` passa a ser `PATCH /users/:id/regioes`, com `regiaoIds`, e o serviço `adicionarSetoresAoUsuario` passa a `adicionarRegioesAoUsuario` (**BREAKING** para clientes da API).
- **Escopo do `SECRETARIA_CNC` por região**: o perfil passa a ler e escrever apenas nas paróquias cujos setores pertencem às suas regiões, herdando integralmente as capacidades do `SECRETARIA_PAROQUIA`.
- **Gestão de paróquias por região**: `create`, `update` e `delete` de paróquia do `SECRETARIA_CNC` validam que o setor da paróquia pertence a uma das regiões do usuário.
- **Detalhe do usuário expõe as regiões vinculadas**: `GET /users/:id` passa a retornar `regioes` ao lado de `paroquias`, para o `ADMIN` conferir o que já está atribuído.
- **Mantém o fluxo do `SECRETARIA_PAROQUIA`**: `PATCH /users/:id/paroquias` continua sendo a forma de o `ADMIN` limitar a secretaria local às paróquias escolhidas.
- **Atualiza specs, seed, testes e documentação** para o vocabulário região/paróquia de cada perfil.

## Capabilities

### New Capabilities

Nenhuma capability nova. O comportamento pertence a capabilities existentes.

### Modified Capabilities

- `usuario`: vínculo usuário–região e rota `PATCH /users/:id/regioes` substituem o vínculo e a rota por setor.
- `escopo-acesso-paroquia`: o escopo local passa a ser do `SECRETARIA_PAROQUIA` por paróquia; o `SECRETARIA_CNC` passa a ser recortado pelas paróquias das suas regiões.
- `paroquia`: a gestão de paróquias pelo `SECRETARIA_CNC` passa a validar a região do setor, e não o setor direto.
- `pessoa`: atualização, casal e cônjuges passam a citar `SECRETARIA_PAROQUIA` no escopo local e `SECRETARIA_CNC` no escopo por região.
- `carisma`: atualização de carismas de pessoa passa a citar `SECRETARIA_PAROQUIA` no escopo por paróquia e `SECRETARIA_CNC` no escopo por região.
- `pessoa-contato`: criação e atualização de contato passam a citar `SECRETARIA_PAROQUIA` no escopo por paróquia e `SECRETARIA_CNC` no escopo por região.
- `auditoria-usuario`: `usuarioRegiao` entra na lista de tabelas de vínculo sem auditoria, no lugar de `usuarioSetor`.
- `serializacao-usuario`: o detalhe do usuário passa a incluir `regioes` vinculadas.

## Impact

- **Banco**: novo modelo `usuarioRegiao`; migration versionada cria a tabela, copia os vínculos de `usuarioSetor` para a região do setor e remove `usuarioSetor`.
- **Código**: `src/users/users.service.ts`, `src/users/users.controller.ts`, `src/users/user.serializer.ts`, novos DTOs, `src/casl/casl-ability/casl-ability.service.ts`, `src/paroquia/paroquia.service.ts`, `prisma/schema.prisma` e `prisma/seed.ts`.
- **API**: `PATCH /users/:id/setores` deixa de existir; `PATCH /users/:id/regioes` é a nova rota. `GET /users/:id` ganha `regioes`. As demais rotas mantêm contrato.
- **Testes**: unitários de `users`, `casl-ability` e `paroquia`; e2e de `users` e o e2e de escopo do `SECRETARIA_CNC`, renomeado de setor para região.
- **Documentação**: `AGENTS.md` passa a descrever o `SECRETARIA_CNC` como secretaria por região e a exceção de auditoria como `usuarioRegiao`.
