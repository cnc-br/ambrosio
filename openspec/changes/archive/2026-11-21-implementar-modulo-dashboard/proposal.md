# Proposal

## Why

O front-end do dashboard (https://apicncbrasil.cn.org.br/dashboard) precisa exibir indicadores consolidados da base — quantidade de pessoas, paróquias, dioceses, comunidades, equipes, carismas e usuários — e hoje a API não oferece nenhuma rota de agregação. Sem um contrato dedicado, o front teria que disparar várias listagens paginadas apenas para contar registros, o que é caro e frágil.

A decisão de arquitetura é **calcular os números sob demanda** no backend, em vez de gravar contadores agregados no banco. Os volumes da base (uma diocese, na casa dos milhares a dezenas de milhares de registros) tornam `count`/`groupBy` com índices baratos. Contadores persistidos exigiriam atualização transacional em toda escrita de pessoa, paróquia, diocese etc., com risco permanente de divergência silenciosa, além de migration e rotina de recálculo — custo desproporcional ao ganho. Um cache em memória de TTL curto resolve a repetição de leitura sem introduzir nova infraestrutura.

## What Changes

- Criar a capability `dashboard`, dona do contrato de leitura dos indicadores agregados consumidos pelo front.
- Expor `GET /dashboard`, autenticado, retornando um único payload com todos os indicadores do v1 (uma chamada por carregamento de tela).
- Indicadores do v1:
  - `pessoas`: total, ativas e inativas.
  - `paroquias`: total.
  - `dioceses`: total.
  - `comunidades`: total.
  - `equipes`: total.
  - `carismas`: total de carismas cadastrados e total de vínculos `pessoaCarisma`.
  - `usuarios`: total e contagem por papel (`roles`).
- Calcular os indicadores sob demanda com `count`/`groupBy` do Prisma executados em paralelo, sem tabela de agregados e sem migration.
- Aplicar cache em memória com TTL de 60 segundos no `DashboardService`, invalidável por restart; os números são globais, então o cache pode ser compartilhado entre requisições e usuários.
- **Números globais**: o dashboard não aplica escopo de paróquia/região. Qualquer usuário autenticado e identificado vê os totais nacionais (decisão confirmada pelo usuário).
- Bloquear o acesso de `NAO_IDENTIFICADO` por verificação CASL de leitura de `pessoa`, coerente com o mapa de permissões vigente; `ADMIN`, catequistas e secretarias acessam.
- Cobrir service e controller com testes unitários e adicionar e2e do endpoint; documentar no Swagger.

Não há **BREAKING CHANGE**: a rota é nova e nenhum comportamento existente é alterado.

## Capabilities

### New Capabilities

- `dashboard`: contrato de leitura dos indicadores agregados do dashboard (pessoas por situação, paróquias, dioceses, comunidades, equipes, carismas, vínculos de carisma e usuários por papel), com autorização, resposta em envelope padrão e política de atualização dos números.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisito alterado. -->

## Impact

- **Código novo**: `src/dashboard/dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`, DTO de resposta e respectivos `*.spec.ts`.
- **Código alterado**: `src/app.module.ts` (importar `DashboardModule`).
- **Banco**: nenhuma alteração de schema e nenhuma migration.
- **API**: novo endpoint `GET /dashboard`, autenticado.
- **Dependências**: nenhuma nova; cache em memória implementado no próprio service (sem Redis e sem `@nestjs/cache-manager`).
- **Testes**: novos `src/dashboard/dashboard.service.spec.ts` e `dashboard.controller.spec.ts`; novo `test/dashboard.e2e-spec.ts` no padrão de `testes-e2e`.
- **Documentação**: anotações Swagger do novo módulo.
