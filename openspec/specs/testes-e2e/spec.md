# Testes E2e Specification

## Purpose

Define o padrão de escrita dos testes end-to-end do projeto: como nomear cada caso, qual cobertura mínima cada controller deve ter e como verificar as respostas, para que o relatório de testes comunique rota, status esperado e comportamento de forma clara e uniforme.

## Requirements

### Requirement: Título padronizado do caso e2e

Todo caso de teste e2e SHALL ter título em pt-br no formato `/<rota> (MÉTODO) - <status> | <descrição>`, informando a rota testada, o método HTTP, o status esperado e a descrição do comportamento verificado.

#### Scenario: Título de caso de sucesso
- **WHEN** um caso verifica uma leitura bem-sucedida da rota `diocese`
- **THEN** o título é semelhante a `/diocese (GET) - 200 | deve retornar dioceses com campos obrigatórios preenchidos`

#### Scenario: Título de caso de erro
- **WHEN** um caso verifica acesso sem autenticação à rota `diocese`
- **THEN** o título é semelhante a `/diocese (GET) - 401 | nao pode ver diocese se nao tiver autenticado` e inclui o status HTTP esperado antes da descrição

#### Scenario: Rota com identificador ou filtro
- **WHEN** o caso testa uma rota com parâmetro de caminho ou query string
- **THEN** o título exibe a rota com esse parâmetro, semelhante a `/diocese/:id (PATCH) - 200 | deve atualizar uma diocese com campos válidos`

### Requirement: Cobertura de autenticação e autorização

Cada controller exposto SHALL ter casos e2e que verifiquem o acesso sem autenticação (401) e o acesso de um usuário autenticado sem permissão (403), quando o recurso for protegido por essas regras.

#### Scenario: Requisição sem token
- **WHEN** a rota protegida é chamada sem o cabeçalho `Authorization`
- **THEN** o teste espera status 401 e corpo com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Usuário autenticado sem permissão
- **WHEN** a rota é chamada com o token de um usuário que não possui a permissão exigida
- **THEN** o teste espera status 403 e corpo com `message` de permissão negada, `error` `Forbidden` e `statusCode` 403

### Requirement: Cobertura de recurso não encontrado e validação

Cada suíte e2e SHALL ter casos que verifiquem recurso ou referência inexistente (404) e payload de entrada inválido (400), conforme as regras do controller.

#### Scenario: Recurso inexistente por identificador
- **WHEN** a rota é chamada com um identificador que não existe
- **THEN** o teste espera status 404 e corpo com `message` no formato `O registro de '<Entidade>' não foi encontrado.` e `statusCode` 404

#### Scenario: Payload inválido
- **WHEN** a rota recebe um payload que viola a validação de entrada
- **THEN** o teste espera status 400 e corpo com a mensagem de validação do campo, `error` `Bad Request` e `statusCode` 400

### Requirement: Cobertura de caminhos de sucesso

Cada suíte e2e SHALL verificar os caminhos de sucesso de leitura e de escrita da rota, conferindo status HTTP e os campos obrigatórios do corpo retornado.

#### Scenario: Leitura bem-sucedida
- **WHEN** a rota de listagem ou de consulta por identificador é chamada com dados válidos
- **THEN** o teste espera status 200 e confere a estrutura do corpo, incluindo os campos obrigatórios e ausência dos campos que não devem ser expostos

#### Scenario: Criação bem-sucedida
- **WHEN** a rota de criação recebe um payload válido
- **THEN** o teste espera status 201 e confere que o corpo retorna o registro criado com os valores enviados

#### Scenario: Atualização bem-sucedida
- **WHEN** a rota de atualização recebe um payload válido para um registro existente
- **THEN** o teste espera status 200 e confere que o corpo reflete os valores atualizados

### Requirement: Verificação do corpo da resposta

Cada caso e2e SHALL verificar o status HTTP esperado e, para respostas de erro, SHALL conferir os campos `message`, `error` (quando aplicável) e `statusCode`; para respostas de sucesso, SHALL conferir os campos obrigatórios do corpo.

#### Scenario: Erro verificado por conteúdo
- **WHEN** um caso espera um erro de negócio
- **THEN** além do status, o teste verifica `res.body.message`, `res.body.error` e `res.body.statusCode`

#### Scenario: Sucesso verificado por conteúdo
- **WHEN** um caso espera sucesso
- **THEN** o teste verifica os campos do corpo retornado, como identificador e atributos enviados, e não apenas o status

### Requirement: Setup padronizado da suíte

Cada suíte e2e SHALL inicializar a aplicação de teste, autenticar com um usuário administrador para obter o token, declarar a variável `principal` com o nome base da rota e encerrar a aplicação ao final da suíte.

#### Scenario: Inicialização da suíte
- **WHEN** a suíte inicia
- **THEN** a aplicação de teste é criada, o login do usuário administrador fornece o token usado nos casos autenticados e a variável `principal` é definida com o nome base da rota

#### Scenario: Encerramento da suíte
- **WHEN** a suíte termina
- **THEN** a aplicação de teste é encerrada e liberada
