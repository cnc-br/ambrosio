# Design

## Context

Ver `proposal.md` — Why. O repositório usa Vitest com SWC (`vitest.config.e2e.ts`), Supertest e um helper único de bootstrap (`test/test-setup.ts`) que sobe o `AppModule` real com `ValidationPipe` e `PrismaExceptionsFilter`, sem mocks do banco (os testes rodam contra o banco seedado por `npm run test:e2e`). O `test/diocese.e2e-spec.ts` é o exemplo canônico mais completo; `test/configuracoes/tipo-diocese.e2e-spec.ts` e afins não seguem o formato de título e são o principal alvo de padronização.

## Goals / Non-Goals

**Goals:**
- Uma referência única (o teste de diocese) e regras objetivas para título, cobertura e asserts.
- Padronizar sem reescrever a lógica de negócio nem a infraestrutura de teste.
- Deixar claro o escopo por arquivo para que a implementação seja mecânica.

**Non-Goals:**
- Trocar o runner, o helper de bootstrap ou o formato de autenticação.
- Introduzir mock de banco ou testes unitários.
- Cobrir controllers que hoje não têm suíte/rota (trabalho separado).

## Decisions

- **Manter um único exemplo canônico.** O título é montado com template string usando a constante `principal` já presente nas suítes: `` `/${principal} (GET) - 200 | <descrição>` ``. Alternativa descartada: um helper que gera títulos — esconderia a rota/status no relatório e complicaria asserts de mensagem.
- **Status como separador textual, não como assert implícito.** O status aparece no título e é repetido em `.expect(<status>)` e em `statusCode`, mantendo a legibilidade e a verificação real.
- **Escopo por arquivo.** Aplicar a convenção primeiro a `test/configuracoes/*.e2e-spec.ts`, `test/mapa/*.e2e-spec.ts` e `test/users/user.e2e-spec.ts`; `test/diocese.e2e-spec.ts` e `test/paroquia.e2e-spec.ts` já servem de base.
- **Dados descartáveis com `faker` em `pt_BR`.** Já usado em diocese/paroquia; manter para os casos 404/400 de escrita.

## Risks / Trade-offs

- [Renomear títulos quebra referências em relatórios/CI filters] → mudança puramente textual; nenhum teste depende do nome.
- [Alguns controllers legítimos não têm auth/perm ou não expõem POST/PATCH] → a cobertura mínima é "quando aplicável"; registrar no teste o que o controller expõe, como faz `tipo-diocese.e2e-spec.ts` para métodos não permitidos.
- [Suítes dependem de dados seedados (ids fixos)] → manter os ids já usados; a padronização não altera dados de seed.

## Open Questions

- Nenhuma pendente.
