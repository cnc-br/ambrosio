# Design

## Context

`PessoaService.create` (ver `proposal.md — Why`) hoje valida permissão CASL, situação religiosa e CPF, cria a pessoa na API externa São Pedro e depois na tabela local, e serializa. O vínculo pessoa↔comunidade só existe no fluxo de comunidade: `ComunidadeService.adicionarPessoa` valida o escopo de paróquia via `validarComunidadeDentroDoEscopoDeAtualizacao` (privado) — 404 se a comunidade não existe, 403 se está fora das paróquias vinculadas ao usuário. `PessoaModule` já importa `ComunidadeModule` (que exporta `ComunidadeService`), então não há dependência circular a resolver. A validação de `update` de comunidade usa `accessibleBy(ability, 'update').comunidade`; perfis sem condição (ex.: ADMIN) resultam em escopo irrestrito (`{}`). A API externa de criação de pessoa **não possui** operação de exclusão correspondente, o que inviabiliza "desfazer" o cadastro externo.

## Goals / Non-Goals

**Goals:**
- Permitir `POST /pessoa?comunidadeId=N` criando a pessoa **e** o vínculo com a comunidade em um fluxo, sem novos endpoints.
- Impedir vínculo com comunidade fora do escopo do usuário **antes** de qualquer escrita (sem efeitos colaterais ao rejeitar).
- Reutilizar a validação de escopo existente (`validarComunidadeDentroDoEscopoDeAtualizacao`) em vez de duplicar a lógica.
- Manter `PessoaService.create` enxuto, delegando a passos privados com responsabilidade única.
- Garantir que, no caso residual de falha ao vincular após a pessoa criada, não reste pessoa local sem vínculo.

**Non-Goals:**
- Alterar a regra de escopo de paróquia em si (comportamento de `escopo-acesso-paroquia` permanece igual).
- Criar novo endpoint de vínculo ou alterar o contrato de `POST /comunidade/:id/pessoa/:pessoaId`.
- Bloquear o cadastro de pessoa sem `comunidadeId` (comportamento atual inalterado).
- Vínculo em lote (múltiplas comunidades por cadastro).

## Decisions

### 1. Validar o escopo ANTES de criar a pessoa (validate-first)

Quando `comunidadeId` é informado, `validarComunidadeDentroDoEscopoDeAtualizacao(comunidadeId)` é chamado **antes** de qualquer escrita (externa ou local). Rejeições (`404` inexistente, `403` fora do escopo ou sem permissão de update em comunidade) nunca produzem efeitos colaterais.

- **Rationale**: a criação na API externa não pode ser desfeita (não há delete no São Pedro). Criar-e-depois-desfazer deixaria órfão externo sempre que a validação falhasse.
- **Alternativa considerada (rejeitada)**: criar pessoa e, em caso de erro no vínculo, desfazer. Rejeitada porque a validação falharia com frequência (usuário adulterando a URL) e cada falha geraria órfão na API externa + compensação frágil.

### 2. Tornar `validarComunidadeDentroDoEscopoDeAtualizacao` pública no `ComunidadeService`

Mínima mudança de visibilidade (privado → público), sem alteração de comportamento. `PessoaService` a injeta via `ComunidadeService` (import de módulo já existente). Evita duplicar a lógica de `accessibleBy`/condição de escopo.

- **Alternativa considerada (rejeitada)**: replicar a validação dentro de `PessoaService`. Rejeitada: duplicaria a regra de escopo e a projeção da condição de `comunidade` → `paroquia`.

### 3. Vincular via `ComunidadeService.adicionarPessoa` (comportamento existente)

Após criar a pessoa, `vincularPessoaNaComunidade(comunidadeId, pessoa.id)` chama `adicionarPessoa`, que revalida (inocuamente, pois o escopo já passou) e cria o registro `comunidadePessoa` com `dataEntrada`.

- **Rationale**: mantém a criação do vínculo em um único lugar, com a validação de escopo garantida mesmo se o caminho de chamada mudar no futuro.
- **Alternativa considerada (rejeitada)**: novo método de baixo nível que cria `comunidadePessoa` sem validar. Rejeitada: reintroduziria a brecha de escopo que este change elimina.

### 4. Compensação no caso residual de falha do vínculo

Após a validação prévia e a criação da pessoa, a única falha realista do `adicionarPessoa` é de banco (a duplicata `comunidadeId+pessoaId` é impossível para pessoa recém-criada). Ainda assim, `vincularPessoaNaComunidade` usa `try/catch`: em erro, apaga a pessoa local recém-criada (`prisma.pessoa.delete`) e **repropaga o erro**.

- **Rationale**: cumpre o requisito de integridade ("não deixar pessoa cadastrada sem o vínculo solicitado") sem depender de transação entre serviços.
- **Trade-off registrado**: o registro externo criado no São Pedro permanece órfão nesse cenário raro (API externa não tem delete). Como o vínculo só falha após a validação ter passado, o impacto é aceitável e documentado.
- **Alternativa considerada (rejeitada)**: `prisma.$transaction` envolvendo os dois writes locais. Rejeitada por ora: exigiria passar um client de transação para outro serviço ou duplicar a criação do `comunidadePessoa`, acoplando os módulos.

### 5. Responsabilidades separadas em `PessoaService` (create enxuto)

`create(createPessoaDto, comunidadeId?)` vira orquestração delegando a métodos privados:

```ts
async create(createPessoaDto, comunidadeId?: number) {
  this.validateCreateAbility('pessoa');
  const situacaoReligiosa = await this.situacaoReligiosaService.findOne(
    createPessoaDto.situacaoReligiosa.id,
  );
  await this.analisarCPF(createPessoaDto.cpf);

  if (comunidadeId !== undefined) {
    await this.validarVinculoComunidade(comunidadeId); // escopo antes de escrever
  }

  const pessoa = await this.criarPessoaCompleta(createPessoaDto, situacaoReligiosa);

  if (comunidadeId !== undefined) {
    await this.vincularPessoaNaComunidade(comunidadeId, pessoa.id); // adicionarPessoa + compensação
  }
  return pessoa;
}
```

- `validarVinculoComunidade(comunidadeId)`: chama `comunidadeService.validarComunidadeDentroDoEscopoDeAtualizacao(comunidadeId)`.
- `criarPessoaCompleta(dto, situacaoReligiosa)`: isola o fluxo externo + `prisma.pessoa.create` + log + `serializePessoaResponse` (hoje sem responsabilidade única).
- `vincularPessoaNaComunidade(comunidadeId, pessoaId)`: `try { await adicionarPessoa } catch { delete local; throw }`.

### 6. Query param no controller

`PessoaController.create` adiciona:

```ts
create(
  @Body() createPessoaDto: CreatePessoaDto,
  @Query(
    'comunidadeId',
    new ParseIntPipe({ optional: true, errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
  )
  comunidadeId?: number,
)
```

Mesmo padrão já usado em `comunidade.controller.ts` para query params numéricos (`ParseIntPipe` opcional → `406` para valores não inteiros). Documentação Swagger com `@ApiQuery` + `@ApiNotAcceptableResponse`.

## Risks / Trade-offs

- [Órfão externo no caso residual de falha de banco ao vincular] → Compensação remove a pessoa local e propaga o erro; cenário só ocorre após a validação já ter passado (falha de banco fora do controle do usuário). Mitigação futura: transação Prisma com client compartilhado.
- [Usuário com permissão de criar pessoa mas sem permissão de atualizar comunidade] → `validarComunidadeDentroDoEscopoDeAtualizacao` usa escopo de `update`; o cadastro com `comunidadeId` responde 403 antes de escrever. Cadastro sem `comunidadeId` continua funcionando.
- [SECRETARIA_CNC sem paróquias vinculadas] → ao usar `comunidadeId`, responde 403 (escopo vazio), alinhado a `escopo-acesso-paroquia`; sem `comunidadeId`, o cadastro segue permitido.
- [Dupla validação de comunidade (prévia + dentro de adicionarPessoa)] → custo de 2 queries pequenas por cadastro com vínculo; aceito em troca de não duplicar a validação em outro lugar.

## Migration Plan

1. Tornar `validarComunidadeDentroDoEscopoDeAtualizacao` público no `ComunidadeService` (sem mudança de comportamento).
2. Refatorar `PessoaService.create` com os passos privados + `comunidadeId?`; ajustar controller com `@Query` e Swagger.
3. Testes unitários e e2e (validação prévia sem criar, vínculo feliz, 404/403/406, comportamento sem param, compensação).
4. **Rollback**: reverter os dois arquivos (controller/service) — nenhuma migração de banco.

## Open Questions

Nenhuma que mude spec, abordagem ou quebra de tarefas: a inclusão do vínculo no corpo da resposta do `POST /pessoa` pode ser decidida depois sem alterar as requirements (a spec não promete o vínculo no corpo).
