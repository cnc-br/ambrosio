# Proposal

## Why

Os testes e2e do projeto não seguem um padrão único de nomenclatura. Em várias suítes o título do caso não informa o status HTTP esperado nem deixa explícita a rota testada (ex.: `test/configuracoes/tipo-diocese.e2e-spec.ts:17` usa `/${principal} (GET) | deve retornar os tipos de diocese`), o que dificulta ler o relatório de falhas e saber de imediato o que cada caso cobre. O `test/diocese.e2e-spec.ts` já estabeleceu um formato que funciona bem (`/${principal} (MÉTODO) - STATUS | descrição`) e precisa ser adotado como padrão de todo o projeto.

## What Changes

- Padronizar o título de **todo** caso e2e no formato `/<rota> (MÉTODO) - <status> | <descrição>`, em pt-br, conforme `test/diocese.e2e-spec.ts`.
- Definir a cobertura mínima esperada por controller: autenticação (401), autorização/permissão (403), não encontrado (404), validação de entrada (400) e caminho felizes de leitura (200) e escrita (201/PATCH 200).
- Padronizar a verificação do corpo de erro: `message`, `error` (quando aplicável) e `statusCode`.
- Padronizar o setup da suíte (login `admin@admin.com`, `token`, `principal`, `beforeAll`/`afterAll` com `setupTestModule`) e o uso de `faker` (`pt_BR`) para dados descartáveis.
- Aplicar a convenção às suítes existentes que ainda não a seguem (ex.: `test/configuracoes/*.e2e-spec.ts`, `test/mapa/*.e2e-spec.ts`), sem alterar comportamento de produção.

## Capabilities

### New Capabilities
- `testes-e2e`: Padrão durável de escrita e organização dos testes end-to-end do projeto — formato do título, cobertura mínima por controller, verificação de respostas de erro/sucesso e setup padronizado da suíte.

### Modified Capabilities
<!-- Nenhuma: não há specs existentes no projeto (openspec/specs/ está vazio). -->

## Impact

- **Testes**: `test/**/*.e2e-spec.ts` (títulos e casos ajustados ao padrão); nenhuma alteração em código de produção.
- **Ferramentas**: `vitest.config.e2e.ts` e `test/test-setup.ts` permanecem a base; nenhuma dependência nova.
- **Documentação**: convenção passa a ser a referência para novos testes e para revisão de PRs.
