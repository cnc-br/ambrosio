# Serializacao Usuario Specification

## Purpose

Define o contrato de exposição do recurso User na API: os campos retornados ao detalhar um usuário, a composição com os dados da pessoa vinculada e as paróquias sob sua responsabilidade, e a exclusão de dados sensíveis da resposta.

## Requirements

### Requirement: Contrato de resposta do detalhe do usuário

Ao detalhar um usuário pelo identificador, o sistema SHALL retornar um objeto `User` com os campos `id`, `email`, `role`, `whatsapp`, `pessoaId`, `pessoa`, `paroquias`, `verifiedWhatsapp`, `active` e `createdAt`, sem campos internos do registro.

#### Scenario: Usuário com pessoa vinculada
- **WHEN** um usuário com `pessoaId` preenchido é detalhado
- **THEN** a resposta contém os campos do contrato e `pessoa` com os dados serializados da pessoa vinculada, incluindo `nome`, `cpf` e `externalId`

#### Scenario: Usuário sem pessoa vinculada
- **WHEN** um usuário sem `pessoaId` é detalhado
- **THEN** a resposta omite os campos `pessoa` e `pessoaId`

### Requirement: Ausência de dados sensíveis no detalhe

A resposta do detalhe do usuário SHALL NOT conter o hash de senha nem os tokens de recuperação de senha (`resetPasswordToken` e `resetPasswordExpires`).

#### Scenario: Hash de senha não exposto
- **WHEN** um usuário é detalhado
- **THEN** a resposta não contém a propriedade `password` em nenhum nível do objeto

#### Scenario: Tokens de recuperação não expostos
- **WHEN** um usuário é detalhado
- **THEN** a resposta não contém `resetPasswordToken` nem `resetPasswordExpires`

### Requirement: Paróquias do usuário na resposta

O campo `paroquias` SHALL conter as paróquias vinculadas ao usuário como objetos `Paroquia` completos, incluindo `id` e `descricao`; um usuário sem vínculos SHALL ter `paroquias` como lista vazia.

#### Scenario: Usuário com paróquias vinculadas
- **WHEN** um usuário possui vínculos em `usuarioParoquias`
- **THEN** `paroquias` contém um objeto por vínculo, cada um com `id` e `descricao` da paróquia

#### Scenario: Usuário sem paróquias vinculadas
- **WHEN** um usuário não possui vínculos em `usuarioParoquias`
- **THEN** `paroquias` é uma lista vazia

### Requirement: Preservação do fluxo de troca de senha

O fluxo de troca de senha SHALL continuar validando a senha atual do usuário contra o hash armazenado no banco, mesmo com a resposta do detalhe sem o hash.

#### Scenario: Troca com senha atual correta
- **WHEN** um usuário autenticado troca a senha informando a senha atual correta
- **THEN** a nova senha é armazenada e o fluxo conclui com sucesso

#### Scenario: Troca com senha atual incorreta
- **WHEN** um usuário autenticado troca a senha informando a senha atual incorreta
- **THEN** o fluxo responde 401 sem alterar a senha armazenada