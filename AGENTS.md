# AGENTS.md — Manual de Operação de Agentes IA (Ambrosio)

Este documento orienta todos os agentes de IA (Antigravity/Gemini, GitHub Copilot, OpenSpec/OpenCode, Cursor, Claude Code e Hermes) operando no repositório `ambrosio`.

---

## 1. Contexto do Repositório
- **Papel**: Backend API core, regras de negócio, controle de acesso granular (CASL) e busca textual (ElasticSearch).
- **Stack**: NestJS 10+, TypeScript, Prisma ORM, PostgreSQL 17, ElasticSearch 8, Vitest.
- **Porta Local**: `3333`. **Produção**: Roteado pelo Nginx em `/api/` (porta interna 3005).
- **Governança Canônica**: [gestao-devsecops/specs/002-backend-ambrosio/SPEC.md](https://github.com/cnc-br/gestao-devsecops/blob/main/specs/002-backend-ambrosio/SPEC.md).

---

## 2. Princípios Mandatórios de Engenharia

### 2.1 Rigor TDD (Test-Driven Development)
- Todo endpoint ou regra de serviço deve possuir teste antes da implementação:
  ```bash
  npm run test
  npm run test:e2e
  ```

### 2.2 Camada de Dados Multi-Schema (Prisma)
- Conexão exclusiva ao schema `ambrosio` do banco unificado `db_gestao`.
- Toda alteração estrutural no banco deve ser realizada através de migrations versionadas:
  ```bash
  npx prisma migrate dev
  ```
- Servidor MCP autorizado para introspecção de banco: `Prisma-Remote` (`https://mcp.prisma.io/mcp`) configurado em `.github/mcp.json`.

### 2.3 Fluxos OpenSpec (`.opencode/commands/`)
- Ao propor uma alteração (`opsx-propose`), gere apenas os artefatos de planejamento (`proposal.md`, `specs/`, `design.md`, `tasks.md`).
- **NÃO** edite código de produção durante o passo de proposta. A implementação ocorre exclusivamente no comando `opsx-apply`.

---

## 3. Agent Skills & Issue Tracker

### Issue Tracker via GitHub CLI (`gh`)
- As issues deste repositório vivem no GitHub. Veja [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
- Operações de wayfinding com labels `wayfinder:map` e dependências `blocked_by`.

### Triage Labels
Usa os 5 papéis canônicos de triagem: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. Veja [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain Docs & Glossário Ubíquo
Consulte [`docs/agents/domain.md`](docs/agents/domain.md) e [`CONTEXT.md`](https://github.com/cnc-br/catarina/blob/main/CONTEXT.md). Use estritamente:
- **Usuário**: Credencial de acesso (email, WhatsApp, papel).
- **Pessoa**: Fiel cadastrado na base (schema `saopedro`).
- **Papel**: Nível de autorização (`ADMIN`, `SECRETARIA_CNC`, `NAO_IDENTIFICADO`).
