# Manutenção Specification

## Purpose

Define o comportamento das tarefas agendadas de manutenção da API: quando executam, como cada execução é rastreada do início ao fim, como o histórico é consultado e como é excluído com segurança.

## Requirements

### Requirement: Agendamento de tarefas de manutenção

O sistema DEVE executar tarefas agendadas de manutenção no fuso `America/Sao_Paulo`, com o agendador inicializado uma única vez na aplicação. A tarefa demonstrativa DEVE executar diariamente às 02:00.

#### Scenario: Execução diária da tarefa demonstrativa

- **WHEN** o horário local de `America/Sao_Paulo` atinge 02:00
- **THEN** a tarefa demonstrativa DEVE ser iniciada
- **AND** o início e o resultado DEVEM ser registrados no log da aplicação

#### Scenario: Agendador não é inicializado mais de uma vez

- **WHEN** a aplicação inicia
- **THEN** o agendador DEVE ser registrado uma única vez
- **AND** cada tarefa agendada NÃO DEVE executar em duplicidade por inicialização repetida

### Requirement: Rastreabilidade do ciclo de vida da execução

Para cada execução de tarefa, o sistema DEVE criar um registro com status `RUNNING`, nome da tarefa e data de início. Ao concluir, DEVE atualizar o status para `SUCCESS` ou `FAILED` e preencher a data de conclusão e a duração em milissegundos, inclusive quando houver falha.

#### Scenario: Execução concluída com sucesso

- **WHEN** a rotina da tarefa termina sem erro
- **THEN** o registro DEVE ser atualizado para `SUCCESS`
- **AND** `finishedAt` e `durationMs` DEVEM ser preenchidos

#### Scenario: Execução concluída com falha

- **WHEN** a rotina da tarefa lança um erro
- **THEN** o registro DEVE ser atualizado para `FAILED`
- **AND** `finishedAt` e `durationMs` DEVEM ser preenchidos
- **AND** o campo de erro DEVE conter uma mensagem útil para diagnóstico, sem dados sensíveis

#### Scenario: Duração calculada ao final da execução

- **WHEN** uma execução é finalizada, com sucesso ou falha
- **THEN** `durationMs` DEVE corresponder ao intervalo entre o início e a conclusão
- **AND** `durationMs` NÃO DEVE ser negativo nem nulo

### Requirement: Tratamento de falhas de rotina e de persistência

O sistema DEVE distinguir falhas da rotina executada de falhas ao persistir o histórico. Uma falha ao gravar o histórico NÃO DEVE mascarar o erro original da rotina, e nenhuma exceção DEVE ser engolida silenciosamente.

#### Scenario: Falha ao registrar o histórico

- **WHEN** a rotina falha e a atualização do registro de histórico também falha
- **THEN** o erro original da rotina DEVE ser preservado e registrado no log
- **AND** a falha de persistência DEVE ser registrada separadamente com contexto suficiente para diagnóstico

#### Scenario: Falha ao criar o registro inicial

- **WHEN** o registro `RUNNING` não pode ser criado antes da rotina
- **THEN** a tarefa DEVE registrar a falha e NÃO DEVE executar a rotina sem rastreabilidade

### Requirement: Consulta paginada do histórico de execuções

O sistema DEVE expor `GET /maintenance/executions` retornando o histórico de execuções do mais recente para o mais antigo, com paginação pelos parâmetros `page` e `limit` e o envelope de resposta padrão da API.

#### Scenario: Histórico com registros

- **WHEN** um usuário autorizado consulta o histórico
- **THEN** a resposta DEVE conter os registros ordenados por início decrescente
- **AND** cada registro DEVE conter nome da tarefa, status, início, conclusão, duração e erro quando houver
- **AND** a resposta DEVE seguir o envelope de paginação `{ server, total, page, limit, data }`

#### Scenario: Histórico vazio

- **WHEN** não existe nenhuma execução registrada
- **THEN** a resposta DEVE retornar `data` como array vazio
- **AND** a consulta NÃO DEVE falhar

#### Scenario: Paginação informada

- **WHEN** o usuário informa `page` e `limit`
- **THEN** a API DEVE aplicar os valores informados
- **AND** DEVE usar `page=1` e `limit=50` quando os parâmetros não forem enviados

### Requirement: Exclusão administrativa do histórico

O sistema DEVE expor `DELETE /maintenance/executions` para excluir somente os registros históricos de execução, retornando a quantidade excluída. A operação NÃO DEVE alterar dados de negócio nem interromper tarefas em execução.

#### Scenario: Exclusão do histórico

- **WHEN** um administrador solicita a exclusão do histórico
- **THEN** todos os registros históricos de execução DEVEM ser removidos
- **AND** a resposta DEVE informar a quantidade de registros excluídos

#### Scenario: Exclusão não afeta dados de negócio

- **WHEN** o histórico é excluído
- **THEN** nenhuma tabela de negócio DEVE ser alterada ou removida

#### Scenario: Exclusão não interrompe tarefas em andamento

- **WHEN** existe uma tarefa em execução no momento da exclusão
- **THEN** a tarefa DEVE continuar executando normalmente
- **AND** a exclusão DEVE se limitar aos registros históricos existentes

### Requirement: Acesso restrito a administradores

Os endpoints de consulta e exclusão do histórico de manutenção DEVEM exigir autenticação e o papel `ADMIN`. Respostas de erro NÃO DEVEM expor stack traces ou detalhes internos da aplicação.

#### Scenario: Requisição sem autenticação

- **WHEN** uma requisição chega sem token válido
- **THEN** a API DEVE responder `401 Unauthorized`
- **AND** NÃO DEVE revelar dados do histórico

#### Scenario: Usuário autenticado sem papel de administrador

- **WHEN** um usuário autenticado sem o papel `ADMIN` acessa qualquer um dos endpoints
- **THEN** a API DEVE responder `403 Forbidden`
- **AND** NÃO DEVE executar a consulta nem a exclusão

#### Scenario: Administrador autorizado

- **WHEN** um usuário autenticado com o papel `ADMIN` acessa os endpoints
- **THEN** a consulta ou a exclusão DEVE ser permitida
