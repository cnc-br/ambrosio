# Avisos Specification

## Purpose

Gerencia os avisos exibidos no front público: cadastro por administradores, consulta pública, atualização e expiração automática quando a data de término é atingida.

## Requirements

### Requirement: Cadastro de aviso por administrador

O sistema DEVE permitir que um administrador cadastre um aviso contendo um texto e uma data de término, exigindo autenticação e o papel `ADMIN`.

#### Scenario: Cadastro realizado com sucesso

- **WHEN** um usuário autenticado com o papel `ADMIN` envia um texto e uma `dataFim` válidos
- **THEN** o aviso DEVE ser criado
- **AND** a resposta DEVE retornar o aviso com `id`, `texto`, `dataFim`, `createdAt` e `updatedAt`

#### Scenario: Texto ausente

- **WHEN** um administrador envia um cadastro sem texto ou com texto vazio
- **THEN** a API DEVE responder com erro de validação
- **AND** nenhum aviso DEVE ser criado

#### Scenario: Data de término ausente

- **WHEN** um administrador envia um cadastro sem `dataFim`
- **THEN** a API DEVE responder com erro de validação
- **AND** nenhum aviso DEVE ser criado

#### Scenario: Requisição sem autenticação

- **WHEN** uma requisição de cadastro chega sem token válido
- **THEN** a API DEVE responder `401 Unauthorized`
- **AND** nenhum aviso DEVE ser criado

#### Scenario: Usuário autenticado sem papel de administrador

- **WHEN** um usuário autenticado sem o papel `ADMIN` tenta cadastrar um aviso
- **THEN** a API DEVE responder `403 Forbidden`
- **AND** nenhum aviso DEVE ser criado

### Requirement: Consulta pública da lista de avisos

O sistema DEVE expor `GET /avisos` sem exigir autenticação, retornando todos os avisos cadastrados (a resposta PODE conter mais de um aviso) no envelope de resposta padrão da API.

#### Scenario: Lista com múltiplos avisos

- **WHEN** existem dois ou mais avisos cadastrados e `GET /avisos` é chamado sem token
- **THEN** a resposta DEVE retornar `200 OK`
- **AND** `data` DEVE conter um array com todos os avisos cadastrados, ordenado do mais recente para o mais antigo

#### Scenario: Acesso público sem credenciais

- **WHEN** a requisição chega sem token de autenticação
- **THEN** a consulta DEVE ser permitida
- **AND** a resposta NÃO DEVE exigir login ou retornar `401`

#### Scenario: Lista vazia

- **WHEN** não existe nenhum aviso cadastrado
- **THEN** a resposta DEVE retornar `data` como array vazio
- **AND** a consulta NÃO DEVE falhar

#### Scenario: Envelope de resposta padrão

- **WHEN** um cliente consulta `GET /avisos`
- **THEN** a resposta DEVE seguir o envelope `{ server, total, page, limit, data }`
- **AND** `total` DEVE corresponder à quantidade de avisos retornados

### Requirement: Consulta individual de aviso

O sistema DEVE expor `GET /avisos/:id` sem exigir autenticação, retornando o aviso com o `id` informado.

#### Scenario: Aviso encontrado

- **WHEN** existe um aviso com o `id` informado
- **THEN** a resposta DEVE retornar o aviso com `texto` e `dataFim`

#### Scenario: Aviso inexistente

- **WHEN** não existe aviso com o `id` informado
- **THEN** a API DEVE responder `404 Not Found`

### Requirement: Atualização de aviso por administrador

O sistema DEVE permitir que um administrador atualize o `texto` e/ou a `dataFim` de um aviso existente, exigindo autenticação e o papel `ADMIN`.

#### Scenario: Atualização do texto

- **WHEN** um administrador envia `PATCH /avisos/:id` alterando apenas o `texto`
- **THEN** o aviso DEVE ser atualizado com o novo texto
- **AND** `dataFim` DEVE permanecer inalterada
- **AND** a resposta DEVE retornar o aviso atualizado

#### Scenario: Atualização da data de término

- **WHEN** um administrador envia `PATCH /avisos/:id` alterando apenas a `dataFim`
- **THEN** o aviso DEVE ser atualizado com a nova data
- **AND** `texto` DEVE permanecer inalterado
- **AND** a resposta DEVE retornar o aviso atualizado

#### Scenario: Aviso inexistente

- **WHEN** não existe aviso com o `id` informado na atualização
- **THEN** a API DEVE responder `404 Not Found`

#### Scenario: Requisição sem autenticação

- **WHEN** uma requisição de atualização chega sem token válido
- **THEN** a API DEVE responder `401 Unauthorized`
- **AND** nenhum aviso DEVE ser alterado

#### Scenario: Usuário autenticado sem papel de administrador

- **WHEN** um usuário autenticado sem o papel `ADMIN` tenta atualizar um aviso
- **THEN** a API DEVE responder `403 Forbidden`
- **AND** nenhum aviso DEVE ser alterado

### Requirement: Expiração automática de avisos vencidos

O sistema DEVE executar um job agendado de manutenção que exclui avisos cuja `dataFim` já passou, rastreado pela infraestrutura de manutenção, e NÃO DEVE depender de interação manual.

#### Scenario: Avisos vencidos são removidos

- **WHEN** o job agendado executa e existem avisos com `dataFim` anterior ao momento da execução
- **THEN** todos os avisos vencidos DEVEM ser excluídos

#### Scenario: Avisos vigentes são preservados

- **WHEN** o job agendado executa e existem avisos com `dataFim` igual ou posterior ao momento da execução
- **THEN** esses avisos NÃO DEVEM ser excluídos

#### Scenario: Nenhum aviso vencido

- **WHEN** o job agendado executa e não existe nenhum aviso vencido
- **THEN** a execução DEVE concluir sem erro
- **AND** nenhum registro DEVE ser excluído

#### Scenario: Execução rastreada pela manutenção

- **WHEN** o job agendado executa
- **THEN** a execução DEVE ser registrada no histórico de manutenção, do início (`RUNNING`) até a conclusão (`SUCCESS` ou `FAILED`)
- **AND** o job NÃO DEVE duplicar a lógica de rastreamento

### Requirement: Ausência de exclusão manual de avisos

A API NÃO DEVE expor endpoint de exclusão manual de avisos; a única forma de remover um aviso DEVE ser o job agendado de expiração.

#### Scenario: Rota de exclusão não disponível

- **WHEN** uma requisição `DELETE /avisos/:id` é feita
- **THEN** a API DEVE responder sem excluir o registro
- **AND** o registro com o `id` informado DEVE permanecer persistido
