# Proposal

## Why

Não existe rota para editar um contato de pessoa, e os contatos são persistidos na API externa São Pedro — a edição precisa operar sobre o id do contato que essa API conhece. Além disso, as rotas de contato devem seguir sempre o padrão aninhado `pessoa/{id}/contato/{...}`, o que é preservado mantendo-as no `PessoaController` (prefixo `pessoa`) em vez de fragmentar em um controller separado na pasta `contato`.

## What Changes

- **Mantém** as rotas de contato no `PessoaController` (`src/pessoa/pessoa.controller.ts`), sob o prefixo `pessoa` — a criação `POST /pessoa/:id/contato` permanece exatamente onde está (sem mover handler, sem controller novo, sem mudança de contrato) e ganha a edição `PATCH /pessoa/:id/contato/:contatoId` ao lado dela. As duas rotas seguem o padrão `pessoa/{id}/contato/{...}`.
- **Adiciona** a rota `PATCH /pessoa/:id/contato/:contatoId`, onde `:id` é o id local da pessoa e `:contatoId` é o **id do contato na API externa São Pedro** (não é id local). A rota atualiza parcialmente o contato e retorna 200 com o contato atualizado em camelCase. Na São Pedro, a atualização usa `PATCH /api/contatos/:contatoId/` (somente o id do contato).
- Adiciona `ContatoService.update(pessoaId, contatoId, dto)` em `src/pessoa/contato/contato.service.ts` (mesmo serviço já existente): valida permissão de atualização sobre `pessoa` (`validateUpdateAbility('pessoa')`), valida a existência da pessoa local e delega a atualização à São Pedro pelo id do contato.
- Adiciona `updateExternalContato(contatoId, dto)` em `SaoPedroContatoService`, fazendo `PATCH ${SAO_PEDRO_API_URL}/api/contatos/${contatoId}/` pelo fluxo autenticado compartilhado (`executeAuthenticatedRequest`).
- Cria o `UpdatePessoaContatoDto` (`src/pessoa/dto/update-pessoa-contato.dto.ts`) com os mesmos campos do `CreatePessoaContatoDto`, todos opcionais (semântica parcial do PATCH), e reaproveita o mapeamento camelCase→snake_case existente para o payload externo.
- Atualiza/estende os testes: `contato.service.spec.ts`, `sao-pedro-contato.service.spec.ts`, `pessoa.controller.spec.ts` (novo caso de delegação do update, mantendo o do `createContato`) e o e2e `test/pessoa/pessoa-contato.e2e-spec.ts` (novos casos 401/403/404/400 e sucesso para o PATCH), seguindo a spec `testes-e2e`.
- O mock `test/mocks/sao-pedro-api-mock.ts` ganha `updateExternalContato`.

## Capabilities

### New Capabilities
<!-- Nenhuma capacidade nova: a gestão de contatos de pessoa já é coberta pela capacidade `pessoa-contato`. -->

### Modified Capabilities
- `pessoa-contato`: adiciona o requisito de **atualização de contato** pela rota `PATCH /pessoa/:id/contato/:contatoId`, incluindo o uso do id externo da São Pedro, a validação de permissão e erro 404 para pessoa inexistente. O requisito de criação `POST /pessoa/:id/contato` permanece inalterado.

## Impact

- `src/pessoa/pessoa.controller.ts` — adiciona o handler `update` (`@Patch(':id/contato/:contatoId')`) com anotações Swagger; `createContato` permanece como está.
- `src/pessoa/contato/contato.service.ts` — novo método `update`.
- `src/pessoa/dto/update-pessoa-contato.dto.ts` — **novo** DTO de atualização de contato.
- `src/external/sao-pedro/sao-pedro-contato.service.ts` — novo método `updateExternalContato`.
- `src/external/sao-pedro/mapper/create-contato.mapper.ts` — assinatura ampliada para aceitar o DTO de atualização (mesmo shape de payload).
- Testes: `src/pessoa/contato/contato.service.spec.ts`, `src/pessoa/pessoa.controller.spec.ts`, `src/external/sao-pedro/sao-pedro-contato.service.spec.ts`, `test/pessoa/pessoa-contato.e2e-spec.ts`, `test/mocks/sao-pedro-api-mock.ts`.
- Sem mudanças no `PessoaModule` (nenhum controller novo para registrar), sem alterações de schema Prisma/migrações (contatos não são persistidos localmente) e sem alterações de autorização CASL (a edição reutiliza a permissão `update` sobre `pessoa`).

### Não faz parte deste escopo
- Rotas de exclusão (`DELETE`) ou listagem dedicada (`GET /pessoa/:id/contato`) de contatos.
- Mover a rota de criação `POST /pessoa/:id/contato` ou criar um controller separado para contatos.
- Mudar o contrato (path, payload ou resposta) da rota de criação `POST /pessoa/:id/contato`.
- Alterar a regra de contato principal: continua delegada à São Pedro.