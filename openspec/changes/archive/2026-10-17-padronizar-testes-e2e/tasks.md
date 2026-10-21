# Tasks

## 1. Padronizar suítes de configurações

- [x] 1.1 Ajustar os títulos de `test/configuracoes/escolaridade.e2e-spec.ts` para o formato `/${principal} (MÉTODO) - STATUS | descrição` (incluir o status esperado nos casos POST/DELETE/PATCH/PUT); verificar que cada título casa com o `.expect(<status>)` correspondente
- [x] 1.2 Ajustar os títulos de `test/configuracoes/tipo-localidade.e2e-spec.ts` ao formato padronizado, incluindo status nos casos GET 200 e nos casos de método não permitido; verificar coerência com os asserts de status
- [x] 1.3 Ajustar os títulos de `test/configuracoes/estado-civil.e2e-spec.ts` ao formato padronizado; verificar coerência com os asserts de status
- [x] 1.4 Ajustar os títulos de `test/configuracoes/tipo-diocese.e2e-spec.ts` ao formato padronizado; verificar coerência com os asserts de status
- [x] 1.5 Ajustar os títulos de `test/configuracoes/pais.e2e-spec.ts` ao formato padronizado (o caso de nome > 100 caracteres deve exibir `- 400 |`); verificar coerência com os asserts de status
- [x] 1.6 Rodar `npm run seed && npx vitest run --config ./vitest.config.e2e.ts test/configuracoes` e confirmar que a suíte passa e que o relatório mostra os títulos com rota, método e status

## 2. Padronizar suítes de mapa

- [x] 2.1 Ajustar os títulos de `test/mapa/regiao.e2e-spec.ts` para o formato `/${principal}... (MÉTODO) - STATUS | descrição` e mover o `403` (ex.: `/regiao/aaaa (GET) - 403`) para o título; verificar coerência com os asserts de status
- [x] 2.2 Ajustar os títulos de `test/mapa/macro-regiao.e2e-spec.ts` ao formato padronizado; verificar coerência com os asserts de status
- [x] 2.3 Ajustar os títulos de `test/mapa/setor.e2e-spec.ts` ao formato padronizado; verificar coerência com os asserts de status
- [x] 2.4 Rodar `npm run seed && npx vitest run --config ./vitest.config.e2e.ts test/mapa` e confirmar que a suíte passa e que os títulos exibem rota, método e status

## 3. Padronizar suítes restantes

- [x] 3.1 Ajustar o título de `test/app.e2e-spec.ts` para o formato `/(GET) - 200 | ...` e verificar que o assert de status bate com o título
- [x] 3.2 Revisar `test/pessoa/pessoa-create.e2e-spec.ts` contra a convenção (títulos já usam `- STATUS |`), corrigir apenas desvios; verificar coerência entre título e `.expect(<status>)`
- [x] 3.3 Revisar `test/users/user.e2e-spec.ts` contra a convenção, corrigir apenas desvios; verificar coerência entre título e `.expect(<status>)`
- [x] 3.4 Rodar `npm run seed && npx vitest run --config ./vitest.config.e2e.ts test/app.e2e-spec.ts test/pessoa test/users` e confirmar que as suítes passam com os títulos padronizados

## 4. Verificação final

- [x] 4.1 Confirmar que todo `it(` em `test/**/*.e2e-spec.ts` segue `/<rota> (MÉTODO) - <status> | <descrição>` (grep não retorna títulos fora do formato)
- [x] 4.2 Rodar `npm run lint` e `npm run build` sem erros no estado final
- [x] 4.3 Rodar `npm run test:e2e` completo e confirmar que todas as suítes passam
- [x] 4.4 Validar o change com `openspec validate "padronizar-testes-e2e" --strict`
