# Proposal

## Why

O front público precisa exibir avisos criados por administradores. Hoje não existe nenhuma estrutura para cadastrar e exibir avisos na API. Avisos têm prazo de validade e devem sumir sozinhos quando o prazo expira, sem depender de ação manual.

## What Changes

- Novos artefatos:
  - Model Prisma `aviso` com `id`, `texto` (mensagem), `dataFim` (data de término), `createdAt` e `updatedAt`, com migration versionada.
  - Novo submódulo `src/configuracoes/avisos` (controller, service, module, DTOs) seguindo o padrão dos demais submódulos de `configuracoes`, exportado pelo `ConfiguracoesModule`.
  - Endpoints REST:
    - `POST /avisos` — cria um aviso (somente `ADMIN`).
    - `GET /avisos` — lista os avisos cadastrados (mais de um pode ser retornado), **público, sem autenticação**, para exibição no front.
    - `GET /avisos/:id` — retorna um aviso, **público, sem autenticação**.
    - `PATCH /avisos/:id` — atualiza `texto` e/ou `dataFim` (somente `ADMIN`). O `DELETE` fica fora do escopo: a exclusão é responsabilidade do job agendado.
  - Novo job agendado no módulo `maintenance` (`AvisosExpiredJob` ou similar) que apaga avisos com `dataFim` no passado, registrado/rastreado pelo `MaintenanceService.runTracked` como o `ExampleJob` já faz.
- Nada é removido nem quebrado (sem `**BREAKING**`).

## Capabilities

### New Capabilities
- `avisos`: Durable behavior covering o gerenciamento de avisos — cadastro por administrador, consulta pública para exibição no front, atualização, e expiração automática quando a data de término é atingida.

### Modified Capabilities
<!-- Nenhuma. O job de limpeza reaproveita a infraestrutura de rastreamento já especificada em `manutencao` (execução agendada via `runTracked`), sem alterar suas requirements. -->

## Impact

- **Banco de dados**: nova tabela `aviso` no schema `ambrosio` via migration Prisma (model `aviso`).
- **Código**: novo diretório `src/configuracoes/avisos/`; alterações em `src/configuracoes/configuracoes.module.ts` (import do novo módulo); novo arquivo de job em `src/maintenance/jobs/` e inclusão no `src/maintenance/maintenance.module.ts`.
- **API/Swagger**: novas rotas documentadas (`/avisos`) — públicas as de leitura, `ADMIN` as de escrita.
- **Testes**: novos testes unitários (controller, service, job) e de e2e, seguindo o padrão de TDD do repositório.
- **Sem novas dependências** externas.
