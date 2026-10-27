import { describe, expect, it } from 'vitest';
import { Pessoa, PessoaContato } from 'neocatecumenal';
import { serializePessoaResponse } from './pessoa.serializer.js';

function pessoaLocalMock() {
  return {
    id: 1,
    ativo: true,
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
    pessoaCarismas: [],
    enderecos: [],
    comunidadePessoas: [],
  };
}

function externalMock(): Pessoa {
  return {
    id: 999,
    externalId: 'uuid-externo',
    nome: 'Maria Silva',
    conhecidoPor: 'Maria',
    cpf: '12345678901',
    sexo: 'F',
    nacionalidade: 'brasileira',
    dataNascimento: new Date('1990-01-01'),
    foto: null,
    ativo: true,
    estadoCivil: 'SOLTEIRO',
    escolaridade: 'ANALFABETO',
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
  };
}

describe('serializePessoaResponse', () => {
  it('deve incluir os contatos na resposta, como os enderecos', () => {
    const contatos: PessoaContato[] = [
      {
        id: 1,
        pessoaId: 999,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        email: 'contato@exemplo.com',
        contatoPrincipal: true,
      },
    ];

    const result = serializePessoaResponse(
      pessoaLocalMock(),
      externalMock(),
      undefined,
      contatos,
    );

    expect(result.contatos).toEqual(contatos);
  });

  it('deixa contatos undefined quando não informados', () => {
    const result = serializePessoaResponse(pessoaLocalMock(), externalMock());

    expect(result.contatos).toBeUndefined();
  });

  it('retorna contatos vazio quando informado um array vazio', () => {
    const result = serializePessoaResponse(
      pessoaLocalMock(),
      externalMock(),
      undefined,
      [],
    );

    expect(result.contatos).toEqual([]);
  });
});