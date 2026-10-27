# Design

## Context

- Contatos agora vivem na São Pedro (`/api/pessoas/{uuid}/contatos/`), puxados via `SaoPedroContatoService` (autenticação/retry via `SaoPedroAuthService.executeAuthenticatedRequest`). A tabela local `pessoaContato` foi removida.
- Todos os GETs de pessoa (`findAll`, `findBy`/`findOne`/`findByExternalId`, `findOneByCpf`) serializam com `serializePessoaResponse`, que já retorna `enderecos` (locais).
- A interface `Pessoa` da lib `neocatecumenal` tem `contatos?: PessoaContato[]`.

## Goals / Non-Goals

**Goals:**
- Retornar `contatos` em todos os GETs de pessoa (listagem, por id, por cpf), no mesmo nível de `enderecos`.
- Buscar na São Pedro reutilizando o padrão de chamada autenticada existente.
- Manter a listagem resiliente a falha individual de contatos.

**Non-Goals:**
- Endpoint dedicado/paginado de contatos; PATCH/DELETE de contato.

## Decisions

### 1. `SaoPedroContatoService.findExternalContatos(pessoaUuid)`

`GET ${SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/` dentro de `this.authService.executeAuthenticatedRequest`, retornando `response.data.data ?? response.data ?? []` como `PessoaContato[]` (a listagem pode vir envelopada em `data`, como em `/api/pessoas`). Padrão idêntico ao `findAllPessoas`.

### 2. `serializePessoaResponse` recebe `contatos`

Quarto parâmetro opcional `contatos?: PessoaContato[]`, retornado no campo `contatos` do objeto da `Pessoa` — espelhando `enderecos`. Quando ausente, fica `undefined` (não serializado).

### 3. Integração no `PessoaService`

- `findAll`: busca os contatos das pessoas da página em **paralelo** (`Promise.all`), monta um `Map<externalId, PessoaContato[]>` e passa ao serializer. Cada falha individual é capturada: loga warning e usa `[]` — a listagem não quebra.
- `findBy` e `findOneByCpf`: buscam `findExternalContatos(pessoa.externalId)` com o mesmo tratamento tolerante a falha, passando `contatos` ao serializer.
- Injeção de `SaoPedroContatoService` no construtor do `PessoaService` (o `PessoaModule` já importa o `SaoPedroModule`).
- *Alternativa considerada:* propagar a falha de contatos (deixar 500) — rejeitada na listagem, onde a pessoa continua válida mesmo sem contatos.

## Risks / Trade-offs

- **N+1 na listagem** → `GET /pessoa` faz uma chamada de contatos por pessoa da página. Mitigação: chamadas paralelas por página (default `limit=50`); melhoria com endpoint em lote fica para quando a São Pedro expor um.
- **Formato da resposta de contatos desconhecido** → Trata envelope `data` e array puro; se divergir, ajuste pontual no método.

## Migration Plan

- Sem migração de dados nem de schema: apenas leitura externa + serialização. Rollback: reverter os commits; os GETs voltam a não incluir contatos.