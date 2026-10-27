import { describe, expect, it } from 'vitest';
import { ContatoResponseMapper } from './contato-response.mapper.js';

describe('ContatoResponseMapper', () => {
  it('deve mapear um contato da São Pedro (snake_case) para PessoaContato com todos os campos', () => {
    expect(
      ContatoResponseMapper.toDomain({
        id: 3,
        pessoa_id: 30529,
        tipo_telefone: 'RESIDENCIAL',
        telefone: '169878787',
        contato_principal: true,
        email: 'Zoie.Franecki@yahoo.com',
        observacao: 'Contato principal',
      }),
    ).toEqual({
      id: 3,
      pessoaId: 30529,
      tipoTelefone: 'RESIDENCIAL',
      telefone: '169878787',
      contatoPrincipal: true,
      email: 'Zoie.Franecki@yahoo.com',
      observacao: 'Contato principal',
    });
  });

  it('deve preservar campos nulos vindos da São Pedro', () => {
    expect(
      ContatoResponseMapper.toDomain({
        id: 2,
        pessoa_id: 30529,
        tipo_telefone: null,
        telefone: null,
        contato_principal: false,
        email: 'Lora53@gmail.com',
      }),
    ).toEqual({
      id: 2,
      pessoaId: 30529,
      tipoTelefone: null,
      telefone: null,
      contatoPrincipal: false,
      email: 'Lora53@gmail.com',
    });
  });

  it('deve omitir campos opcionais ausentes', () => {
    const result = ContatoResponseMapper.toDomain({
      id: 1,
      pessoa_id: 30529,
      tipo_telefone: 'CELULAR',
      telefone: '11987654321',
      contato_principal: true,
    });

    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('observacao');
  });

  it('deve mapear uma lista de contatos da São Pedro', () => {
    expect(
      ContatoResponseMapper.toDomainList([
        {
          id: 3,
          pessoa_id: 30529,
          tipo_telefone: 'RESIDENCIAL',
          telefone: '169878787',
          contato_principal: true,
        },
        {
          id: 2,
          pessoa_id: 30529,
          tipo_telefone: null,
          telefone: null,
          contato_principal: false,
          email: 'Lora53@gmail.com',
        },
      ]),
    ).toEqual([
      {
        id: 3,
        pessoaId: 30529,
        tipoTelefone: 'RESIDENCIAL',
        telefone: '169878787',
        contatoPrincipal: true,
      },
      {
        id: 2,
        pessoaId: 30529,
        tipoTelefone: null,
        telefone: null,
        contatoPrincipal: false,
        email: 'Lora53@gmail.com',
      },
    ]);
  });
});