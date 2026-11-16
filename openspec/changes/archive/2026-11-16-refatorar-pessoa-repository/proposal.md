# Proposal

## Why

`PessoaService` e `CasalService` acessam `PrismaService` diretamente, misturando regra de negócio, autorização CASL e persistência no mesmo arquivo. Isso torna os serviços difíceis de testar sem mockar o client inteiro do Prisma, espalha `include`/`select` de pessoa por vários pontos e acopla as regras ao formato do schema.

## What Changes

- Cria `PessoaRepository` em `src/pessoa/repositories/pessoa.repository.ts` como uma camada fina e tipada sobre `PrismaService`, centralizando leitura e escrita do agregado `pessoa`.
- Cria `PessoaCasalRepository` em `src/pessoa/repositories/pessoa-casal.repository.ts` para as operações de `pessoaCasal`, mantendo cada repositório responsável por uma tabela/agregado.
- Centraliza em constantes próprias do repositório os `include`/`select` usados pelos fluxos de pessoa (detalhe, listagem e busca de cônjuge), reutilizando `ENDERECO_INCLUDE` e `PESSOA_CARISMA_INCLUDE`.
- Refatora `PessoaService` para depender dos repositórios e manter apenas autorização CASL, validações de domínio, orquestração com a API São Pedro e serialização.
- Refatora `CasalService` para usar os mesmos repositórios, deixando de acessar `PrismaService`.
- Registra os repositórios como providers do `PessoaModule` e ajusta os testes unitários para injetar mocks dos repositórios.
- Mantém sem alteração os contratos HTTP, as regras de autorização, as mensagens de erro, a serialização e o schema do banco.
- **Não** refatora `ContatoService` (não acessa banco) nem outros módulos nesta primeira etapa.

## Capabilities

### New Capabilities

Nenhuma. Esta é uma refatoração pura de implementação, sem mudança de comportamento observável ou de requisito; por isso o change declara `skip_specs: true` em `.openspec.yaml`.

### Modified Capabilities

Nenhuma. Os requisitos existentes de `pessoa` e `pessoa-contato` continuam válidos e inalterados.

## Impact

- Código afetado: `src/pessoa/pessoa.service.ts`, `src/pessoa/casal/casal.service.ts`, `src/pessoa/pessoa.module.ts`, novos arquivos em `src/pessoa/repositories/` e os testes `pessoa.service.spec.ts` e `casal.service.spec.ts`.
- Sem alteração de API pública, DTOs, banco de dados, migrations ou dependências externas.
- Testes e2e existentes (`test/pessoa/*`) devem continuar passando sem alteração.
- Benefício: serviços testáveis com mocks de repositório, includes/selects centralizados e menor acoplamento ao Prisma.