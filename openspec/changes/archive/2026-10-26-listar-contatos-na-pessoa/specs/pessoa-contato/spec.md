# Spec Delta

## ADDED Requirements

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