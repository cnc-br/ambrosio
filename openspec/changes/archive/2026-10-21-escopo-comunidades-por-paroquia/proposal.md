# Proposal

## Why

A listagem de comunidades (`GET /comunidade`) hoje retorna todas as comunidades do sistema, sem considerar quem é o usuário autenticado. Usuários com o perfil `SECRETARIA_CNC` deveriam ver apenas as comunidades das paróquias sob sua responsabilidade, e esse vínculo já existe na tabela `usuarioParoquia`. Sem esse recorte, um usuário enxerga dados de paróquias que não são suas.

## What Changes

- Definir o escopo de acesso por paróquia: o usuário com role `SECRETARIA_CNC` só acessa comunidades cuja paróquia esteja vinculada a ele em `usuarioParoquia`.
- Aplicar o escopo na listagem `GET /comunidade`: retornar apenas comunidades das paróquias do usuário, em interseção com os filtros opcionais existentes (`paroquiaId`, `numeroDaComunidade`).
- Quando um usuário `SECRETARIA_CNC` não tem paróquias vinculadas — ou informa um `paroquiaId` fora do seu escopo — a rota responde **200 com lista vazia**.
- `ADMIN` e os demais roles mantêm o comportamento atual: listam todas as comunidades (respeitando as regras de permissão já existentes).
- O recorte vale, nesta mudança, apenas para a **listagem** de comunidades; demais rotas de comunidade e outros recursos permanecem inalterados.
- Comportamento observável para `SECRETARIA_CNC` muda (passa a retornar um subconjunto) — mudança de comportamento para esse role, sem quebra para `ADMIN`.

## Capabilities

### New Capabilities
- `escopo-acesso-paroquia`: define como o acesso a recursos pertencentes a uma paróquia (começando pelas comunidades) é restringido conforme o role do usuário e as paróquias vinculadas a ele em `usuarioParoquia`.

### Modified Capabilities
_(nenhuma)_

## Impact

- **Código**:
  - `src/casl/casl-ability/casl-ability.service.ts` — adicionar condição de paróquia à permissão de leitura de `comunidade` do role `SECRETARIA_CNC`.
  - `src/comunidade/comunidade.service.ts` — aplicar o filtro de escopo em `findAll`.
- **Testes**: criar suíte e2e de comunidades cobrindo `SECRETARIA_CNC` (vê só as suas), `ADMIN` (vê todas) e usuário sem paróquias (lista vazia).
- **Seed**: prever um usuário `SECRETARIA_CNC` vinculado a paróquias via `usuarioParoquia` para os testes, se ainda não existir.
- **Banco**: nenhuma alteração de schema — `usuarioParoquia` já existe.
- **API**: `GET /comunidade` passa a retornar subconjunto para `SECRETARIA_CNC`; contrato de resposta inalterado.
