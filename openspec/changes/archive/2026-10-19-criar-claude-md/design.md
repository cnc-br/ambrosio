# Design

## Context

Ver `proposal.md` — Why. O repositório já possui specs que definem comportamento (ver `openspec/specs/testes-e2e/spec.md` para as convenções de teste e2e e `openspec/specs/contexto-usuario/spec.md` para autenticação/decorator de usuário) e um `AGENTS.md` que é apenas índice de skills. Não há um documento que apresente a arquitetura da API e as convenções de e2e para agentes. O conteúdo de `CLAUDE.md` deve ser fiel ao código e às specs existentes — não um inventário exaustivo de rotas.

## Goals / Non-Goals

**Goals:**
- Um documento único, em pt-br, que dá a agentes o contexto essencial para trabalhar no projeto: stack, arquitetura de módulos, autenticação/autorização e convenções transversais.
- Reproduzir as regras de teste e2e conforme a spec `testes-e2e` (formato de título, cobertura mínima, verificação de corpo, setup), sem reescrever a spec.
- Apontar para fontes canônicas (Swagger em `/api`, specs, README) em vez de duplicar detalhes que mudam com frequência.

**Non-Goals:**
- Não alterar `AGENTS.md` (permanece como índice de skills).
- Não alterar código, specs, rotas ou comportamento.
- Não documentar rota por rota (o Swagger é a fonte canônica da superfície de API).
- Não traduzir nem criar versão em inglês.

## Decisions

- **Novo arquivo `CLAUDE.md` na raiz.** O usuário escolheu criar um arquivo novo em vez de estender `AGENTS.md`; opencode e agentes Claude leem ambos, então o arquivo deve ser autossuficiente para contexto do projeto, mas sem contradizer `AGENTS.md`. Alternativas descartadas: estender `AGENTS.md` (mantê-lo enxuto como índice de skills) e criar `docs/` com link (o usuário optou por arquivo na raiz).
- **Idioma pt-br.** Todo o material do projeto (README, titles e2e, specs, `AGENTS.md`) é em português; `CLAUDE.md` segue a convenção.
- **Estrutura em seções voltadas a agentes**, na ordem em que ajudam a tarefa típica: visão geral → stack/arquitetura → autenticação/autorização → convenções (validação, erros, paginação, logging) → testes e2e (regras da spec `testes-e2e`) → comandos (scripts do `package.json`). Cada seção curta, com referências a fontes canônicas.
- **Fonte de verdade das regras e2e = spec `testes-e2e`.** A seção de e2e do `CLAUDE.md` resume a spec (título `/<rota> (MÉTODO) - <status> | <descrição>`, cobertura 401/403/404/400/200/201, asserts `message`/`error`/`statusCode`, setup com `setupTestModule`, login `admin@admin.com`/`admin`, `principal`, `faker` `pt_BR`) e referencia a spec para o detalhe completo.
- **Conteúdo de API ancorado em fontes canônicas.** Descrever módulos e rotas de forma agrupada (ex.: `pessoa`, `diocese`, `paroquia`, `mapa/*`, `configuracoes/*`, `auth`, `users`, `comunidade`, `equipe`, `carisma`, `external/sao-pedro`, `health`) e remeter ao Swagger em `http://localhost:3005/api` para a lista exata de endpoints.

## Risks / Trade-offs

- [Drift: documentação divergir do código ao longo do tempo] → manter `CLAUDE.md` enxuto e ancorado nas fontes canônicas (Swagger, specs, scripts), evitando replicar detalhes voláteis.
- [Duplicação de contexto entre `AGENTS.md` e `CLAUDE.md` gerando instruções conflitantes] → papéis distintos: `AGENTS.md` = índice de skills/processos; `CLAUDE.md` = arquitetura da API e testes. Sem sobreposição.
- [Spec de e2e evoluir sem o documento acompanhar] → a seção de e2e referencia a spec `testes-e2e` como fonte de verdade e avisa isso explicitamente no texto, reduzindo a chance de o leitor tratar o `CLAUDE.md` como definitivo.

## Migration Plan

Não aplicável — mudança puramente documental. Rollback: excluir o arquivo `CLAUDE.md`.

## Open Questions

Nenhuma.
