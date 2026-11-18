# Proposal

## Why

Hoje apenas o model `pessoa` registra quem criou (`cadastradoPorId`) e quem editou (`atualizadoPorId`) um registro. Nas demais tabelas não há rastreabilidade de autoria, o que impede auditar mudanças feitas por usuários e torna inconsistente a base entre os recursos. Precisamos de um padrão único de auditoria de criação/edição em **todas** as tabelas, com regra documentada para que **novas** tabelas já nasçam com os campos.

## What Changes

- **Campos de auditoria em todas as tabelas**: adiciona `cadastradoPorId` e `atualizadoPorId` (FK opcional para `user`, `onDelete: SetNull`, com índices) e, onde não existirem, `createdAt` e `updatedAt`, seguindo exatamente o padrão do model `pessoa`. Tabelas **excluídas**: `user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution` e `ScheduledJobStatus` (enum, sem tabela).
- **Preenchimento nas rotas de escrita**: rotas autenticadas que criam/atualizam registros passam a gravar o id do usuário autenticado (`@CurrentUser`) em `cadastradoPorId` (criação) e `atualizadoPorId` (criação e atualização), com a autoria sempre vinda do contexto autenticado — nunca do payload.
- **Rotas públicas sem quebra**: rotas de escrita hoje sem autenticação (`endereco`, `pais`) ganham `OptionalAuthGuard` + `@CurrentUser`: gravam a autoria quando um token válido é enviado e mantêm o acesso público atual quando não há token.
- **Política de NULL**: tabelas sem rota de escrita (populadas via seed) mantêm os campos de auditoria `NULL` até existir rota autenticada que os preencha.
- **Campos não expostos na API**: `cadastradoPorId` e `atualizadoPorId` não são devolvidos em nenhuma resposta, preservando os contratos atuais (mesma regra já aplicada a `pessoa`).
- **Regra para agentes em novas tabelas**: adiciona em `AGENTS.md` (e nota em `CLAUDE.md`) a regra mandatória de que toda nova tabela deve incluir `cadastradoPorId`, `atualizadoPorId`, `createdAt` e `updatedAt`. Não será criado um `CONTEXT.md` (evita fragmentar a orientação; `AGENTS.md` já é o manual canônico dos agentes).

## Capabilities

### New Capabilities

- `auditoria-usuario`: registro obrigatório e transversal da autoria de criação/edição por usuário em todas as tabelas (padrão `pessoa`), incluindo a política de NULL para tabelas sem rota de escrita, a não exposição dos campos na API, a regra de que o payload não pode forjar autoria e a obrigatoriedade dos campos em novas tabelas.

### Modified Capabilities

<!-- Nenhuma spec existente muda de requisito: os contratos de API e as permissões
     permanecem idênticos; a auditoria é comportamento novo transversal, coberto
     pela capability nova acima. A spec `pessoa` já descreve a autoria do próprio
     recurso e não é alterada. -->

## Impact

- **Banco**: nova migration Prisma adicionando colunas, relações e índices em ~29 models (todos exceto `pessoa` — que já possui o padrão —, `user`, `usuarioParoquia`, `usuarioSetor`, `ScheduledJobExecution` e o enum `ScheduledJobStatus`); o model `user` ganha as relações de retorno (`pessoasCadastradas`/`pessoasAtualizadas` já existem; novas por tabela).
- **Código**: controllers/serviços dos módulos com rota de escrita — `carisma` (+ `pessoaCarisma`), `comunidade` (+ `comunidadePessoa`, `comunidadeEtapa`, `comunidadeHistorico`), `equipe` (+ `equipePessoa`), `paroquia`, `diocese`, `localidade`, `endereco` (+ fluxos aninhados `pais`/`estado`/`cidade`/`pessoaEndereco`), `configuracoes` (`pais`, `estado-civil`, `avisos`) e `pessoa/casal` (+ `pessoaCasal`). `pessoa` já está implementado.
- **API**: rotas públicas de escrita de `endereco` e `pais` passam a aceitar autenticação opcional (sem mudança de contrato para chamadores atuais); nenhuma resposta passa a expor auditoria.
- **Testes**: unitários e e2e das rotas de escrita passam a verificar a gravação de autoria; testes existentes que comparam corpos de resposta continuam passando (campos não expostos).
- **Documentação**: `AGENTS.md` (nova subseção em "Princípios Mandatórios de Engenharia") e `CLAUDE.md` (nota em "Convenções transversais").
