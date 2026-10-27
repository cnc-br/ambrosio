# Spec Delta

## ADDED Requirements

### Requirement: Contatos serializados em camelCase nas respostas

O sistema SHALL retornar os contatos nas respostas da API ambrosio em camelCase, conforme a interface `PessoaContato` — `id`, `pessoaId`, `tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal` —, tanto nas leituras individuais de pessoa (`GET /pessoa/:id`, `GET /pessoa?cpf=` e leitura por `externalId`) quanto na criação de contato (`POST /pessoa/:id/contato`), independentemente de a API São Pedro trafegar os dados em snake_case.

#### Scenario: Detalhe por id retorna os contatos em camelCase
- **WHEN** um usuário autenticado chama `GET /pessoa/:id` e a São Pedro retorna contatos com campos em snake_case (`pessoa_id`, `tipo_telefone`, `contato_principal`)
- **THEN** a resposta inclui o campo `contatos` com os campos em camelCase (`pessoaId`, `tipoTelefone`, `contatoPrincipal`)

#### Scenario: Detalhe por cpf retorna os contatos em camelCase
- **WHEN** um usuário autenticado chama `GET /pessoa?cpf=` e a São Pedro retorna contatos com campos em snake_case
- **THEN** a resposta inclui o campo `contatos` com os campos em camelCase conforme a interface `PessoaContato`

#### Scenario: Criação de contato retorna o contato criado em camelCase
- **WHEN** um usuário autenticado chama `POST /pessoa/:id/contato` e a São Pedro retorna o contato criado com campos em snake_case
- **THEN** a resposta 201 inclui o contato criado com os campos em camelCase conforme a interface `PessoaContato`, mesmo que o envio à São Pedro seja em snake_case
