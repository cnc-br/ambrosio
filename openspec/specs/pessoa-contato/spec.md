# Pessoa Contato Specification

## Purpose

Gerencia os contatos de uma pessoa — telefones, e-mail, observação e marcação de contato principal — definindo o contrato de criação de um contato vinculado a uma pessoa existente.

## Requirements

### Requirement: Criação de contato para uma pessoa

O sistema SHALL permitir criar um contato para uma pessoa existente por meio da rota `POST /pessoa/:id/contato`, aceitando os campos `tipoTelefone` (um dos valores `CELULAR`, `RESIDENCIAL` ou `COMERCIAL`), `telefone`, `email`, `observacao` e `contatoPrincipal`. Os dados não são persistidos no banco local: o sistema SHALL encaminhá-los à API externa São Pedro e, ao criar com sucesso, retornar 201 com o contato criado.

#### Scenario: Criação de contato com todos os campos
- **WHEN** um usuário autenticado e com permissão chama `POST /pessoa/:id/contato` com um payload contendo `tipoTelefone`, `telefone`, `email`, `observacao` e `contatoPrincipal` para uma pessoa existente
- **THEN** o sistema encaminha os dados à São Pedro e responde 201 retornando o contato criado com os valores enviados

#### Scenario: Criação de contato apenas com os campos opcionais preenchidos
- **WHEN** o payload contém apenas campos opcionais (por exemplo, somente `telefone` e `email`)
- **THEN** o sistema encaminha os dados à São Pedro e responde 201, com os campos ausentes assumindo os defaults do modelo da São Pedro (ex.: `contatoPrincipal` como `true` quando não informado)

### Requirement: Regra do contato principal único garantida pela São Pedro

O sistema SHALL delegar à API São Pedro a garantia de que uma pessoa tenha no máximo um contato com `contatoPrincipal: true`, rebaixando para `false` o `contatoPrincipal` dos demais contatos da mesma pessoa quando um novo principal é criado. Quando `contatoPrincipal` não é informado, a São Pedro aplica o default do modelo (`true`).

#### Scenario: Novo contato principal rebaixa o principal anterior
- **WHEN** uma pessoa já possui um contato com `contatoPrincipal: true` e um novo contato é criado para ela com `contatoPrincipal: true`
- **THEN** a São Pedro garante que o novo contato passa a ser o principal e que o contato anterior passa a ter `contatoPrincipal: false`, restando apenas um contato principal

#### Scenario: Contato sem contatoPrincipal usa o default da São Pedro
- **WHEN** um novo contato é criado para uma pessoa sem informar `contatoPrincipal`
- **THEN** o contato é criado como principal (`contatoPrincipal: true`), aplicando o default do modelo da São Pedro

### Requirement: Autenticação e permissão na criação de contato

O sistema SHALL exigir autenticação e permissão de criação sobre o recurso `pessoa` para processar `POST /pessoa/:id/contato`; sem token ou sem permissão, o sistema SHALL rejeitar a criação.

#### Scenario: Criação sem autenticação
- **WHEN** `POST /pessoa/:id/contato` é chamado sem token de autenticação
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Criação por usuário autenticado sem permissão
- **WHEN** um usuário autenticado sem permissão de criação sobre `pessoa` chama `POST /pessoa/:id/contato`
- **THEN** o sistema responde 403 com `message` `Você não tem permissão para create pessoa`, `error` `Forbidden` e `statusCode` 403

### Requirement: Pessoa inexistente na criação de contato

O sistema SHALL responder 404 quando `POST /pessoa/:id/contato` receber o id de uma pessoa que não existe, sem criar nenhum contato.

#### Scenario: Pessoa não encontrada
- **WHEN** um usuário com permissão chama `POST /pessoa/:id/contato` com um id de pessoa inexistente
- **THEN** o sistema responde 404 com `message` `O registro de 'Pessoa' não foi encontrado.` e `statusCode` 404, e nenhum contato é criado

### Requirement: Validação do payload de criação de contato

O sistema SHALL validar o payload de `POST /pessoa/:id/contato` e responder 400 quando um campo informado violar as regras de validação (tipos, formatos e valores permitidos dos campos do contato).

#### Scenario: E-mail inválido
- **WHEN** o payload contém um `email` que não é um endereço de e-mail válido
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo `email`

#### Scenario: tipoTelefone com valor não permitido
- **WHEN** o payload contém um `tipoTelefone` que não é `CELULAR`, `RESIDENCIAL` ou `COMERCIAL`
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo `tipoTelefone`

#### Scenario: Campo com tipo inválido
- **WHEN** o payload contém um campo com tipo inválido, por exemplo `contatoPrincipal` como texto em vez de booleano
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo informado

### Requirement: Contatos incluídos na leitura de pessoa

O sistema SHALL incluir os contatos da pessoa (`tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal`) na leitura de pessoa — `GET /pessoa`, `GET /pessoa/:id` e `GET /pessoa?cpf=` —, obtidos da API São Pedro, no mesmo nível que os `enderecos`. Quando a pessoa não possui contatos, o sistema SHALL retornar um array vazio; na listagem, uma falha ao buscar os contatos de uma pessoa não impede a resposta (a pessoa retorna com `contatos` vazio).

#### Scenario: Listagem devolve os contatos de cada pessoa
- **WHEN** um usuário autenticado chama `GET /pessoa` e a São Pedro retorna contatos para uma pessoa da listagem
- **THEN** a resposta inclui o campo `contatos` com os contatos da pessoa no mesmo nível de `enderecos`

#### Scenario: Pessoa sem contatos
- **WHEN** um usuário autenticado chama `GET /pessoa` (ou `GET /pessoa/:id`) e a pessoa não possui contatos na São Pedro
- **THEN** a resposta inclui `contatos` como um array vazio

#### Scenario: Listagem tolerante a falha na busca de contatos
- **WHEN** a busca de contatos de uma pessoa na São Pedro falha durante `GET /pessoa`
- **THEN** a listagem continua respondendo 200 e a pessoa afetada retorna com `contatos` como array vazio

#### Scenario: Detalhe por id inclui os contatos
- **WHEN** um usuário autenticado chama `GET /pessoa/:id` e a São Pedro retorna contatos para a pessoa
- **THEN** a resposta inclui o campo `contatos` com os contatos da pessoa