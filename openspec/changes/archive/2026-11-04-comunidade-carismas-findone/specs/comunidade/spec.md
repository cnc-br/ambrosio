# Spec Delta

## Purpose

Capacidade que define o comportamento da consulta de comunidades no backend, incluindo a exposição dos carismas (responsável, co-responsável, catequista etc.) e das pessoas vinculadas a cada carisma na resposta do `findOne`.

## ADDED Requirements

### Requirement: findOne expõe os carismas da comunidade
Ao consultar uma comunidade individual, o sistema DEVE retornar um atributo `carismas` na resposta, conforme o contrato `ComunidadeCarisma` de `neocatecumenal`.

#### Scenario: Comunidade possui pessoas com carisma
- **WHEN** o usuário consulta uma comunidade existente via `findOne`
- **THEN** a resposta DEVE incluir `carismas` como um array de carismas, onde cada item contém `id`, `descricao` e `tipo`
- **AND** cada carisma DEVE listar em `pessoas` as pessoas da comunidade que possuem aquele carisma, com `id`, `externalId`, `nome` e `casal`

#### Scenario: Carisma andado em casal retorna o cônjuge
- **WHEN** uma pessoa vinculada à comunidade possui um carisma que anda em casal (`casalAndaJunto: true`) e possui cônjuge em `pessoaCasal`
- **THEN** o item em `pessoas` DEVE ser sempre o **marido**, com `casal` igual a `true`
- **AND** DEVE incluir `conjugue` com `id`, `externalId` e `nome` da **mulher**
- **AND** quando marido e mulher possuem o mesmo carisma, DEVE existir apenas um item para o casal

#### Scenario: Comunidade sem pessoas com carisma
- **WHEN** a comunidade consultada não possui nenhuma pessoa com carismas
- **THEN** a resposta DEVE retornar `carismas` como um array vazio

#### Scenario: findOne sem carismas não quebra as demais consultas
- **WHEN** os carismas são populados apenas no `findOne`
- **THEN** `findAll` e os demais métodos de comunidade continuam trabalhando sem o atributo `carismas` e sem alterações de comportamento