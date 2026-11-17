# Alteracao Senha Specification

## Purpose

Permite que qualquer usuário autenticado troque a própria senha e que a recuperação de senha defina uma senha temporária, sem exigir permissões administrativas e sem ampliar o que o usuário pode alterar na própria conta.

## Requirements

### Requirement: Troca de senha por qualquer usuário autenticado

O sistema SHALL permitir que qualquer usuário autenticado e ativo, independentemente do seu papel, altere a própria senha por `POST /auth/change-password`. A identidade do usuário SHALL ser obtida do token autenticado, nunca de um identificador enviado no corpo da requisição.

#### Scenario: Troca de senha por perfil não administrador
- **WHEN** um usuário autenticado e ativo com papel `SECRETARIA_CNC`, catequista, `SECRETARIA_PAROQUIA` ou `NAO_IDENTIFICADO` informa a senha atual correta e uma nova senha válida em `POST /auth/change-password`
- **THEN** o sistema responde `201` com a mensagem `Senha alterada com sucesso.` e a nova senha passa a ser aceita no login

#### Scenario: Identidade obtida do token
- **WHEN** um usuário autenticado informa no corpo da requisição um identificador de outro usuário
- **THEN** o sistema ignora esse identificador e altera somente a senha do usuário autenticado no token

#### Scenario: Usuário inativo
- **WHEN** um usuário inativo tenta trocar a própria senha
- **THEN** o sistema responde `401` sem alterar a senha armazenada

### Requirement: Confirmação da senha atual

O sistema SHALL exigir a senha atual correta para concluir a troca de senha e SHALL NOT alterar a senha armazenada quando a confirmação falhar.

#### Scenario: Senha atual correta
- **WHEN** o usuário autenticado informa a senha atual correta e uma nova senha válida
- **THEN** a senha é substituída e o fluxo conclui com sucesso

#### Scenario: Senha atual incorreta
- **WHEN** o usuário autenticado informa a senha atual incorreta
- **THEN** o sistema responde `401` e a senha anterior continua válida

#### Scenario: Senha atual ausente
- **WHEN** a requisição não informa a senha atual
- **THEN** o sistema responde `400` sem alterar a senha armazenada

### Requirement: Validação da nova senha

A nova senha SHALL ser uma string com no mínimo 6 caracteres. O sistema SHALL rejeitar a troca quando a nova senha não atender a essa regra, sem alterar a senha armazenada.

#### Scenario: Nova senha curta
- **WHEN** o usuário informa uma nova senha com menos de 6 caracteres
- **THEN** o sistema responde `400` com a mensagem `A nova senha deve ter no mínimo 6 caracteres` e a senha anterior continua válida

### Requirement: Autenticação obrigatória na troca de senha

O sistema SHALL exigir autenticação para `POST /auth/change-password`, rejeitando requisições sem token válido.

#### Scenario: Troca sem token
- **WHEN** `POST /auth/change-password` é chamado sem token de autenticação
- **THEN** o sistema responde `401` com `message` `Invalid or missing token` e `statusCode` 401

#### Scenario: Troca com token inválido ou expirado
- **WHEN** `POST /auth/change-password` é chamado com token inválido ou expirado
- **THEN** o sistema responde `401` com `message` `Invalid token` e `statusCode` 401

### Requirement: Recuperação de senha para qualquer usuário existente

O sistema SHALL processar `POST /auth/forgot-password` sem autenticação, definindo uma senha temporária e os dados de recuperação para qualquer usuário existente, independentemente do seu papel, e SHALL responder com a mesma mensagem genérica independentemente de o email existir.

#### Scenario: Recuperação para usuário não administrador
- **WHEN** `POST /auth/forgot-password` recebe o email de um usuário existente com papel diferente de `ADMIN`
- **THEN** o sistema define a senha temporária e os dados de recuperação do usuário, sem exigir autenticação ou permissão administrativa

#### Scenario: Recuperação para email inexistente
- **WHEN** `POST /auth/forgot-password` recebe um email que não pertence a nenhum usuário
- **THEN** o sistema responde com a mensagem genérica de envio e não altera nenhum registro

### Requirement: Isolamento das permissões administrativas de usuário

A permissão de trocar a própria senha SHALL NOT conceder ao usuário comum permissão para editar a própria conta por `PATCH /users/:id` nem para alterar a senha de outros usuários.

#### Scenario: Perfil não administrador tenta editar usuário
- **WHEN** um usuário autenticado com papel diferente de `ADMIN` chama `PATCH /users/:id`, inclusive com o próprio id
- **THEN** o sistema responde `403` com `message` `Você não tem permissão para update user` sem alterar o registro

#### Scenario: Administrador preservado
- **WHEN** um usuário `ADMIN` chama `PATCH /users/:id` com dados válidos
- **THEN** o sistema continua permitindo a edição administrativa do usuário
