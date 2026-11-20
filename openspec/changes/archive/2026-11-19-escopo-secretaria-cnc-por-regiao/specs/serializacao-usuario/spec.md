# Spec Delta

## MODIFIED Requirements

### Requirement: Contrato de resposta do detalhe do usuário

Ao detalhar um usuário pelo identificador, o sistema SHALL retornar um objeto `User` com os campos `id`, `email`, `role`, `whatsapp`, `pessoaId`, `pessoa`, `paroquias`, `regioes`, `verifiedWhatsapp`, `active` e `createdAt`, sem campos internos do registro.

#### Scenario: Usuário com pessoa vinculada
- **WHEN** um usuário com `pessoaId` preenchido é detalhado
- **THEN** a resposta contém os campos do contrato e `pessoa` com os dados serializados da pessoa vinculada, incluindo `nome`, `cpf` e `externalId`

#### Scenario: Usuário sem pessoa vinculada
- **WHEN** um usuário sem `pessoaId` é detalhado
- **THEN** a resposta omite os campos `pessoa` e `pessoaId`

## ADDED Requirements

### Requirement: Regiões do usuário na resposta

O campo `regioes` SHALL conter as regiões vinculadas ao usuário em `usuarioRegiao` como objetos com `id` e `descricao`; um usuário sem vínculos SHALL ter `regioes` como lista vazia. O campo SHALL existir mesmo quando a lista estiver vazia, para que o `ADMIN` distinga "sem regiões" de "campo ausente".

#### Scenario: Usuário com regiões vinculadas
- **WHEN** um usuário possui vínculos em `usuarioRegiao`
- **THEN** `regioes` contém um objeto por vínculo, cada um com `id` e `descricao` da região

#### Scenario: Usuário sem regiões vinculadas
- **WHEN** um usuário não possui vínculos em `usuarioRegiao`
- **THEN** `regioes` é uma lista vazia
