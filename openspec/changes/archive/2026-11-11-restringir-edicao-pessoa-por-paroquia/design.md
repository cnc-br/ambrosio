# Design

## Context

Ver `proposal.md` para a motivação. O `SECRETARIA_CNC` já tem `read` e `update` de `pessoa` sem condição em `src/casl/casl-ability/casl-ability.service.ts`. O `PessoaService.update` hoje valida a permissão com `validateUpdateAbility('pessoa')`, que avalia a string do recurso e não a condição do registro. O `ComunidadeService` já resolve o mesmo problema com `accessibleBy` + `findFirst` + `findUniqueOrThrow` para distinguir 404 de 403.

A relação de uma pessoa com a paróquia é `pessoa.comunidadePessoas[] → comunidadePessoa.comunidade → comunidade.paroquia → paroquia.usuarioParoquias[]`. A pessoa não tem `paroquiaId` direto.

`CasalService` e `ContatoService` também usam `validateCreateAbility`/`validateUpdateAbility('pessoa')` com string, e hoje não consultam o escopo. O `GET /pessoa/conjugue` não chama `validateReadAbility` e não filtra por paróquia. O `PessoaModule` já concentra `PessoaService`, `CasalService` e `ContatoService`, permitindo reutilizar a validação de escopo sem criar um novo módulo.

## Goals / Non-Goals

**Goals:**

- Restringir a atualização de `pessoa` para `SECRETARIA_CNC` ao escopo de paróquias do usuário.
- Manter a leitura de `pessoa` irrestrita para `SECRETARIA_CNC` em `GET /pessoa` e `GET /pessoa/:id`.
- Restringir a criação de casal (`POST /pessoa/casal`) e a leitura de cônjuges (`GET /pessoa/conjugue`) ao mesmo escopo.
- Restringir a criação e atualização de contatos (`POST /pessoa/:id/contato` e `PATCH /pessoa/:id/contato/:contatoId`) ao mesmo escopo.
- Manter `ADMIN` sem restrição e `create` de pessoa inalterado.
- Distinguir 404 (pessoa inexistente) de 403 (pessoa existente fora do escopo).

**Non-Goals:**

- Criar `DELETE /pessoa/:id` ou qualquer endpoint de exclusão.
- Alterar a listagem de comunidades, o escopo de `create` de pessoa ou a leitura de `GET /pessoa` e `GET /pessoa/:id`.
- Alterar schema, migrations ou dependências.
- Expor `usuarioParoquias` ou `comunidadePessoas` na resposta de pessoa.

## Decisions

### Condição CASL com `OR` e `none`/`some`

A permissão `SECRETARIA_CNC` de `update` de `pessoa` passa a usar:

```ts
can('update', 'pessoa', {
  OR: [
    { comunidadePessoas: { none: { dataSaida: null } } },
    {
      comunidadePessoas: {
        some: {
          dataSaida: null,
          comunidade: {
            is: {
              paroquia: {
                is: {
                  usuarioParoquias: { some: { userId: user.id } },
                },
              },
            },
          },
        },
      },
    },
  ],
});
```

- `none: { dataSaida: null }` representa “pessoa sem vínculo ativo”, que deve ser editável.
- `some: { dataSaida: null, ... }` exige um vínculo ativo cuja paróquia esteja em `usuarioParoquia`.
- `@casl/prisma` 1.6.2 já traduz `OR`, `some`, `none` e `is` para `PrismaWhereInput`; `accessibleBy` usa o mesmo mapeamento.
- Alternativa considerada: `can('update', 'pessoa', { ... })` sem `OR` e tratar “sem vínculo” no serviço. Rejeitada porque o `OR` mantém a regra no CASL e permite reutilizar `accessibleBy` em qualquer ponto.

### Validação no serviço com `accessibleBy` + `findFirst`

O `PessoaService.update` passa a chamar `validarPessoaDentroDoEscopoDeAtualizacao(id)` antes de `findOne(id)`, seguindo o padrão de `ComunidadeService`:

```ts
const updateScope = accessibleBy(this.abilityService.ability, 'update').pessoa;
const pessoaNoEscopo = await this.prisma.pessoa.findFirst({
  where: { AND: [{ id }, updateScope] },
});
if (!pessoaNoEscopo) {
  await this.prisma.pessoa.findUniqueOrThrow({ where: { id } });
  throw new ForbiddenException('Você não tem permissão para atualizar pessoa fora das suas paróquias.');
}
```

- `accessibleBy` para `ADMIN` retorna `{}` (o `manage all`), então a consulta não restringe.
- Para `SECRETARIA_CNC`, a consulta aplica o `OR` acima.
- `findFirst` retorna `null` para pessoa fora do escopo; `findUniqueOrThrow` então distingue 404 (não existe) de 403 (existe, mas fora do escopo).
- Alternativa considerada: `ability.can('update', subject('pessoa', pessoa))` no `BaseService`. Rejeitada porque o objeto carregado por `findOne` não inclui `usuarioParoquias` e o `findOne` já executa chamadas externas; a consulta no banco antes do `findOne` evita chamadas desnecessárias e vazamento de detalhe.

### Reutilização da validação de escopo em casal, cônjuge e contato

`PessoaService.validarPessoaDentroDoEscopoDeAtualizacao(id)` é o ponto único de validação de escopo de pessoa. `CasalService` e `ContatoService` passam a injetar `PessoaService` e chamar esse método:

- `CasalService.createCasal`: valida `pessoaId` e `conjugueId` antes de qualquer escrita; se qualquer um estiver fora do escopo, retorna 403.
- `CasalService.findAllBySexoEstadoCivilCasado`: chama `validateReadAbility('pessoa')` e filtra o `findMany` de `pessoa` com `comunidadePessoas: { some: { dataSaida: null, comunidade: { is: { paroquia: { is: { usuarioParoquias: { some: { userId } } } } } } } }` (apenas vínculos ativos; sem o fallback `none` de pessoa sem vínculo), restringindo o `GET /pessoa/conjugue` às paróquias do usuário. Para `ADMIN`, a condição é `{}`.
- `ContatoService.create`: valida `pessoaId` antes de chamar a São Pedro.
- `ContatoService.update`: valida `pessoaId` antes de chamar a São Pedro.

Alternativa considerada: duplicar a consulta `accessibleBy` em cada serviço. Rejeitada porque espalha a regra e cria divergência entre endpoints; a reutilização mantém o mesmo critério de 404/403 e o mesmo tratamento de `dataSaida`.

A leitura de `GET /pessoa` e `GET /pessoa/:id` permanece usando a permissão `read` (sem condição), então não é afetada por essa reutilização.

### Ordem de validação no `update`

1. `validateUpdateAbility('pessoa')` (mantém a regra de perfil).
2. `validarPessoaDentroDoEscopoDeAtualizacao(id)` (novo escopo).
3. `findOne(id)` (dados e chamadas externas).
4. Validação de CPF, situação religiosa e atualização externa.

A validação antes do `findOne` garante que uma pessoa fora do escopo não dispare chamadas à API externa nem altere o estado.

## Risks / Trade-offs

- **Pessoa sem vínculo ativo pode ser editada por qualquer `SECRETARIA_CNC`** → risco aceito por decisão de produto; o caso é documentado no spec e pode ser revisto se houver vínculo obrigatório.
- **Vínculos históricos não contam** → uma pessoa que saiu da comunidade pode ser editada por qualquer `SECRETARIA_CNC`, mesmo que o vínculo histórico seja de outra paróquia; a decisão foi tomada para alinhar ao critério de membros ativos.
- **Condição `OR` no CASL** → se a versão do `@casl/prisma` mudar, o mapeamento de `OR`/`none`/`some` pode ser afetado; os testes de `accessibleBy` e do serviço cobrem o comportamento.
- **`update` com múltiplos vínculos** → basta um vínculo ativo em paróquia do usuário; a pessoa com vínculos em paróquias próprias e de terceiros é editável, conforme o spec.
- **`CasalService` depende de `PessoaService`** → o módulo `PessoaModule` já concentra os dois serviços e não há ciclo; se a injeção mudar, a validação de escopo pode ser extraída para um serviço compartilhado.
- **`GET /pessoa/conjugue` reutiliza o escopo de `update`** → a leitura de cônjuges usa o mesmo critério de escrita, não o `read`; se a leitura de `pessoa` mudar, o `conjugue` não deve acompanhar automaticamente.
- **`POST /pessoa/casal` com duas pessoas** → a validação de ambas as pessoas antes da escrita evita que o casal seja criado com uma pessoa fora do escopo e que a rotina de união de comunidade propague a pessoa para outra paróquia.

## Migration Plan

Sem alterações de banco. A mudança é aplicada em código e testes. Rollback: remover a condição de `update` e as validações de escopo em `PessoaService`, `CasalService` e `ContatoService`, restaurando o comportamento anterior de `update` irrestrito para `SECRETARIA_CNC`.
