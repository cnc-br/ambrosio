# Spec Delta

## REMOVED Requirements

### Requirement: Contatos incluídos na leitura de pessoa

**Reason**: A listagem `GET /pessoa` buscava os contatos da São Pedro para cada pessoa da página (uma chamada externa por item), deixando a listagem lenta; a busca de contatos passa a ocorrer apenas nas leituras individuais, e a listagem deixa de retornar o campo `contatos`.

**Migration**: Para obter os contatos de uma pessoa, usar a leitura individual — `GET /pessoa/:id` ou `GET /pessoa?cpf=` —, que continua retornando o campo `contatos`. A listagem `GET /pessoa` não inclui mais o campo nos itens.

## ADDED Requirements

### Requirement: Contatos incluídos nas leituras individuais de pessoa

O sistema SHALL incluir os contatos da pessoa (`tipoTelefone`, `telefone`, `email`, `observacao`, `contatoPrincipal`), obtidos da API São Pedro, no mesmo nível que os `enderecos`, nas leituras individuais de pessoa — `GET /pessoa/:id` e `GET /pessoa?cpf=` (e leitura por `externalId`) —, retornando array vazio quando a pessoa não possui contatos e tolerando falha na busca (a leitura segue respondendo 200 com `contatos` vazio). A listagem `GET /pessoa` SHALL NOT incluir o campo `contatos`.

#### Scenario: Detalhe por id inclui os contatos
- **WHEN** um usuário autenticado chama `GET /pessoa/:id` e a São Pedro retorna contatos para a pessoa
- **THEN** a resposta inclui o campo `contatos` com os contatos da pessoa no mesmo nível de `enderecos`

#### Scenario: Detalhe por cpf inclui os contatos
- **WHEN** um usuário autenticado chama `GET /pessoa?cpf=` e a São Pedro retorna contatos para a pessoa
- **THEN** a resposta inclui o campo `contatos` com os contatos da pessoa

#### Scenario: Pessoa sem contatos
- **WHEN** um usuário autenticado chama `GET /pessoa/:id` (ou `GET /pessoa?cpf=`) e a pessoa não possui contatos na São Pedro
- **THEN** a resposta inclui `contatos` como um array vazio

#### Scenario: Leitura individual tolerante a falha na busca de contatos
- **WHEN** a busca de contatos de uma pessoa na São Pedro falha durante `GET /pessoa/:id` (ou `GET /pessoa?cpf=`)
- **THEN** a leitura continua respondendo 200 e a pessoa retorna com `contatos` como array vazio

#### Scenario: Listagem não inclui os contatos
- **WHEN** um usuário autenticado chama `GET /pessoa` e a São Pedro possui contatos para uma pessoa da listagem
- **THEN** a resposta não inclui o campo `contatos` nos itens da listagem, independentemente de a São Pedro possuir contatos para a pessoa
