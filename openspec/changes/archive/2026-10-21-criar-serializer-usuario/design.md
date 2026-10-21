# Design

## Context

`UsersService.findOne` hoje devolve o registro cru do Prisma (incluindo o hash de `password`) com `usuarioParoquias` achatado em `{ id, descricao }`. O projeto já padroniza a composição de respostas com `src/pessoa/pessoa.serializer.ts` (funções puras que montam o domínio `Pessoa` a partir do registro cru + dados externos). O contrato de resposta alvo é a interface `User` exportada pelo pacote `neocatecumenal` (novo release), que inclui `pessoa?: Pessoa` e `paroquias: Paroquia[]` e não contém `password`. O `UsersService` já injeta `PessoaService` e o `UsersModule` já importa `PessoaModule`. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- `findOne` passa a retornar `Promise<User>` montado por um serializer no mesmo padrão do `pessoa.serializer.ts`.
- A resposta `GET /users/:id` inclui a pessoa vinculada (via `pessoaService`) e as paróquias do usuário como `Paroquia[]` completas, sem `password`/tokens de recuperação.
- O fluxo de troca de senha (`auth.service.changePassword`) segue funcional, lendo o hash por um caminho dedicado.

**Non-Goals:**
- Serializar `create`, `findAll` e `findOneByEmail` (continuam retornando o cru; escopo pede apenas `findOne`).
- Alterar o pacote `neocatecumenal` (repositório externo) — apenas consumir seu release.
- Mudar regras de autorização ou o shape de `pessoa` (reusa o `Pessoa` já produzido).

## Decisions

1. **Serializer de usuário em `src/users/user.serializer.ts`** — Módulo de funções puras `serializeUserResponse(rawUser, pessoa?)` que monta o objeto `User` (mesmo estilo de `serializePessoaResponse`). O `password` e demais campos internos jamais são copiados. `whatsapp` nulo mapeia para `''` (a interface exige `string`) e `pessoaId` nulo mapeia para `undefined` (a interface o torna opcional). *Alternativa considerada:* classe/`class-transformer` — rejeitada por fugir do padrão do repositório e dificultar o teste direto.

2. **Compor `pessoa` via `pessoaService.findOne(user.pessoaId)`** — Análise pedida pelo usuário: **sim, é necessário buscar em `pessoa.service`** quando `pessoaId` está preenchido, pois o contrato `User.pessoa` é o objeto `Pessoa` completo (dados internos + dados externos da São Pedro + campos derivados como cônjuge e comunidade), que só o `PessoaService.findOne` produz. Quando `pessoaId` é nulo, o campo `pessoa` (e `pessoaId`) fica ausente e **não** há chamada a `pessoa.service`. *Alternativa considerada:* incluir a relação `pessoa` do Prisma diretamente — rejeitada, pois não satisfaz o contrato `Pessoa` (falta nome/CPF externos e campos derivados).

3. **Select dedicado para `paroquias` (satisfazer `Paroquia`)** — O include atual (`{ id, descricao }`) não satisfaz o tipo `Paroquia` (exige `diocese`, `endereco`, `setor` e a cadeia `setor → regiao → macroRegiao`). Cria-se `PAROQUIA_BASICA_SELECT` em `src/prisma/selects/paroquia.select.ts` reutilizando `ENDERECO_SELECT` e `DIOCESE_SELECT` e incluindo `setor` com `regiao.macroRegiao`, omitindo `comunidades`/`observacao` (opcionais na interface) para manter a resposta leve. *Alternativa considerada:* reusar `PAROQUIA_SELECT` — rejeitada por carregar `comunidades` de cada paróquia (payload desnecessário no detalhe do usuário).

4. **`findOneWithPassword` dedicado para o fluxo de auth** — `auth.service.changePassword` hoje lê `user.password`/`user.active` do retorno de `findOne`. Com o serializer removendo `password`, o `UsersService` ganha um método `findByIdWithPassword(id)` (lookup cru no Prisma, com `password` e `active`) usado só pelo fluxo de troca de senha. *Alternativa considerada:* manter `password` em `findOne` — rejeitada (vaza o hash no controller); ou injetar `PrismaService` no `AuthService` — rejeitada, concentrar acesso a dados no `UsersService` segue o padrão atual.

5. **Consumir `User` de `neocatecumenal`** — Importação nomeada `import { User } from 'neocatecumenal'` (mesmo padrão do `Pessoa`, exportado pelo barrel do pacote). Exige bump da dependência quando o release com a interface `User` for publicado. O contrato fica fixado na spec delta, então a implementação pode ser feita assim que o pacote estiver disponível.

## Risks / Trade-offs

- [`changePassword` quebra se o hash não estiver acessível] → Mitigação: método dedicado `findByIdWithPassword` mantém o hash só no fluxo de auth; teste unitário do fluxo preservado.
- [`pessoaService.findOne` lança (`findUniqueOrThrow`) se a pessoa referenciada não existir, tornando `GET /users/:id` erro] → Comportamento aceitável para inconsistência de dados (espelha o lookup atual); com `pessoaId` nulo não há chamada e o campo é omitido.
- [Custo de performance: incluir `pessoa` adiciona chamadas à API externa da São Pedro no detalhe do usuário] → Inerente ao contrato `Pessoa` completo (o endpoint de pessoa já faz isso); se o cliente precisar apenas de `nome`/`cpf`, um caminho mais leve pode ser criado depois.
- [Payload de `paroquias` maior que o atual (`{id, descricao}`) por causa do `Paroquia` completo] → Trade-off aceito para honrar o contrato; `PAROQUIA_BASICA_SELECT` omite `comunidades` para reduzir o custo.
- [Release do `neocatecumenal` com `User` ainda não publicado] → Mitigação: contrato fixado na spec; ordenar a tarefa de bump da dependência primeiro, deixando o build bloqueado de forma explícita até o release (ou tipo temporário local, se necessário para destravar).

## Migration Plan

Deploy único, sem migração de dados. Rollback: reverter as alterações do serializer/serviço e do `changePassword` (git revert). Break de contrato apenas em `GET /users/:id` (remoção de `password`); consumidores do endpoint não devem depender do hash (não deveriam, por segurança). Testes: incluir unitário de `findOne` serializado (com e sem pessoa/paróquias) e manter os cenários e2e de auth (login e troca de senha) verdes.