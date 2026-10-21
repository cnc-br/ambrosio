# Spec Delta

## Purpose

Disponibiliza o usuário autenticado — e campos como `role` — ao handler do controller de forma padronizada, inclusive identificando o usuário em rotas que não exigem autenticação quando um token válido é enviado.

## ADDED Requirements

### Requirement: Usuário autenticado disponível no controller

Em toda request autenticada, o sistema SHALL disponibilizar os dados do usuário autenticado ao handler do controller, por meio de um decorator de parâmetro, incluindo o campo `role`.

#### Scenario: Acesso ao usuário completo
- **WHEN** o handler declara o decorator de usuário sem argumento
- **THEN** o handler recebe o registro do usuário autenticado da request, contendo `id`, `email` e `role`

#### Scenario: Acesso a um campo específico
- **WHEN** o handler declara o decorator de usuário informando o nome de um campo (ex.: `role`)
- **THEN** o handler recebe apenas o valor desse campo do usuário autenticado

### Requirement: Identificação opcional do usuário

Em rotas que não exigem autenticação, o sistema SHALL identificar o usuário quando um token Bearer válido for enviado e SHALL permitir a request sem usuário quando nenhum token for enviado.

#### Scenario: Token válido em rota sem exigência de autenticação
- **WHEN** uma rota que não exige autenticação recebe um token Bearer válido
- **THEN** o sistema resolve o usuário da request e o disponibiliza ao handler pelo decorator

#### Scenario: Requisição sem token em rota sem exigência de autenticação
- **WHEN** uma rota que não exige autenticação é chamada sem o cabeçalho `Authorization`
- **THEN** a request é processada normalmente e o decorator de usuário resulta em valor ausente

### Requirement: Token inválido em rota sem exigência de autenticação

Quando uma rota que não exige autenticação recebe um token Bearer presente, porém inválido ou expirado, o sistema SHALL rejeitar a request com status 401.

#### Scenario: Token inválido ou expirado
- **WHEN** uma rota sem exigência de autenticação recebe um token Bearer inválido ou expirado
- **THEN** o sistema responde 401 com `message` `Invalid token`, `error` `Unauthorized` e `statusCode` 401

### Requirement: Preservação das regras de proteção

As rotas protegidas SHALL continuar exigindo autenticação (401 sem token) e SHALL negar o acesso de usuário sem a permissão exigida (403), mantendo o comportamento atual.

#### Scenario: Rota protegida sem token
- **WHEN** uma rota protegida é chamada sem o cabeçalho `Authorization`
- **THEN** o sistema responde 401 com `message` `Invalid or missing token`, `error` `Unauthorized` e `statusCode` 401

#### Scenario: Rota protegida com usuário sem permissão
- **WHEN** uma rota protegida com `@RequiredRoles` é chamada por usuário autenticado que não possui a permissão exigida
- **THEN** o sistema responde 403 com `error` `Forbidden` e `statusCode` 403
