# Spec Delta

## MODIFIED Requirements

### Requirement: Criação de contato para uma pessoa

O sistema SHALL permitir criar um contato para uma pessoa existente por meio da rota `POST /pessoa/:id/contato`, aceitando os campos `tipoTelefone` (um dos valores `CELULAR`, `RESIDENCIAL` ou `COMERCIAL`), `telefone`, `email`, `observacao` e `contatoPrincipal`. Os dados não são persistidos no banco local: o sistema SHALL encaminhá-los à API externa São Pedro e, ao criar com sucesso, retornar 201 com o contato criado.

#### Scenario: Criação de contato com todos os campos
- **WHEN** um usuário autenticado e com permissão chama `POST /pessoa/:id/contato` com um payload contendo `tipoTelefone`, `telefone`, `email`, `observacao` e `contatoPrincipal` para uma pessoa existente
- **THEN** o sistema encaminha os dados à São Pedro e responde 201 retornando o contato criado com os valores enviados

#### Scenario: Criação de contato apenas com os campos opcionais preenchidos
- **WHEN** o payload contém apenas campos opcionais (por exemplo, somente `telefone` e `email`)
- **THEN** o sistema encaminha os dados à São Pedro e responde 201, com os campos ausentes assumindo os defaults do modelo da São Pedro (ex.: `contatoPrincipal` como `true` quando não informado)

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

## REMOVED Requirements

### Requirement: Regra do contato principal único

**Reason**: A persistência dos contatos foi movida para a API São Pedro, que passa a garantir a regra do contato principal único com comportamento diferente do contrato local antigo — incluindo o default `true` quando `contatoPrincipal` é omitido — tornando inválido o cenário anterior em que um contato sem `contatoPrincipal` não alterava o principal existente.

**Migration**: O comportamento passa a ser coberto pelo requisito "Regra do contato principal único garantida pela São Pedro" (adicionado nesta mudança) e pela criação de contato modificada.

## ADDED Requirements

### Requirement: Regra do contato principal único garantida pela São Pedro

O sistema SHALL delegar à API São Pedro a garantia de que uma pessoa tenha no máximo um contato com `contatoPrincipal: true`, rebaixando para `false` o `contatoPrincipal` dos demais contatos da mesma pessoa quando um novo principal é criado. Quando `contatoPrincipal` não é informado, a São Pedro aplica o default do modelo (`true`).

#### Scenario: Novo contato principal rebaixa o principal anterior
- **WHEN** uma pessoa já possui um contato com `contatoPrincipal: true` e um novo contato é criado para ela com `contatoPrincipal: true`
- **THEN** a São Pedro garante que o novo contato passa a ser o principal e que o contato anterior passa a ter `contatoPrincipal: false`, restando apenas um contato principal

#### Scenario: Contato sem contatoPrincipal usa o default da São Pedro
- **WHEN** um novo contato é criado para uma pessoa sem informar `contatoPrincipal`
- **THEN** o contato é criado como principal (`contatoPrincipal: true`), aplicando o default do modelo da São Pedro