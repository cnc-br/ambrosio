# Pessoa Contato Specification

## Purpose

Gerencia os contatos de uma pessoa — telefones, e-mail, observação e marcação de contato principal — definindo o contrato de criação de um contato vinculado a uma pessoa existente.

## Requirements

### Requirement: Criação de contato para uma pessoa

O sistema SHALL permitir criar um contato para uma pessoa existente por meio da rota `POST /pessoa/:id/contato`, aceitando os campos `telefoneResidencial`, `telefoneCelular`, `observacao`, `ativo`, `email` e `contatoPrincipal`. Ao criar com sucesso, o sistema SHALL retornar 201 com o contato criado vinculado à pessoa do id informado.

#### Scenario: Criação de contato com todos os campos
- **WHEN** um usuário autenticado e com permissão chama `POST /pessoa/:id/contato` com um payload contendo `telefoneResidencial`, `telefoneCelular`, `email`, `observacao`, `ativo` e `contatoPrincipal` para uma pessoa existente
- **THEN** o sistema responde 201 e retorna o contato criado com `pessoaId` igual ao id informado e os valores enviados

#### Scenario: Criação de contato apenas com os campos opcionais preenchidos
- **WHEN** o payload contém apenas campos opcionais (por exemplo, somente `telefoneCelular` e `email`)
- **THEN** o sistema cria o contato com `ativo` `true` e `contatoPrincipal` `false`, respondendo 201

### Requirement: Regra do contato principal único

O sistema SHALL garantir que uma pessoa tenha no máximo um contato com `contatoPrincipal: true`. Ao criar um contato com `contatoPrincipal: true`, o sistema SHALL rebaixar para `false` o `contatoPrincipal` de todos os demais contatos da mesma pessoa na mesma transação.

#### Scenario: Novo contato principal rebaixa o principal anterior
- **WHEN** uma pessoa já possui um contato com `contatoPrincipal: true` e um novo contato é criado para ela com `contatoPrincipal: true`
- **THEN** o sistema cria o novo contato como principal e o contato anterior passa a ter `contatoPrincipal: false`, restando apenas um contato principal

#### Scenario: Contato sem contatoPrincipal não altera o principal existente
- **WHEN** uma pessoa já possui um contato com `contatoPrincipal: true` e um novo contato é criado para ela sem informar `contatoPrincipal`
- **THEN** o sistema cria o novo contato com `contatoPrincipal: false` e mantém o contato principal existente inalterado

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

O sistema SHALL validar o payload de `POST /pessoa/:id/contato` e responder 400 quando um campo informado violar as regras de validação (tipos e formatos dos campos do contato).

#### Scenario: E-mail inválido
- **WHEN** o payload contém um `email` que não é um endereço de e-mail válido
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo `email`

#### Scenario: Campo com tipo inválido
- **WHEN** o payload contém um campo com tipo inválido, por exemplo `contatoPrincipal` como texto em vez de booleano
- **THEN** o sistema responde 400 com `error` `Bad Request`, `statusCode` 400 e a mensagem de validação do campo informado