import { describe, expect, it } from 'vitest';
import { serializeUserResponse } from './user.serializer.js';

const rawUser = {
  id: 'uuid-usuario-1',
  email: 'carmem@neocatecumenal.com.es',
  password: 'hash-super-secreto',
  role: 'ADMIN',
  whatsapp: '16999999999',
  verifiedWhatsapp: false,
  active: true,
  createdAt: new Date('2026-10-20T10:00:00Z'),
  updatedAt: new Date('2026-10-21T10:00:00Z'),
  resetPasswordToken: 'token-recuperacao',
  resetPasswordExpires: new Date('2026-10-21T11:00:00Z'),
  usuarioParoquias: [
    {
      paroquia: {
        id: 1,
        descricao: 'Paróquia São José',
        diocese: { id: 1, descricao: 'Diocese de São Carlos' },
        endereco: { id: 1, cep: '01310-100' },
        setor: { id: 1, descricao: 'Setor Centro' },
      },
    },
  ],
};

describe('serializeUserResponse', () => {
  it('monta o User com os campos do contrato, sem dados internos', () => {
    const result = serializeUserResponse(rawUser);

    expect(result).toEqual({
      id: rawUser.id,
      email: rawUser.email,
      role: rawUser.role,
      whatsapp: rawUser.whatsapp,
      paroquias: rawUser.usuarioParoquias.map(({ paroquia }) => paroquia),
      verifiedWhatsapp: rawUser.verifiedWhatsapp,
      active: rawUser.active,
      createdAt: rawUser.createdAt,
    });
  });

  it('não expõe password, resetPasswordToken nem resetPasswordExpires', () => {
    const result = serializeUserResponse(rawUser);

    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('resetPasswordToken');
    expect(result).not.toHaveProperty('resetPasswordExpires');
  });

  it('mapeia whatsapp nulo para string vazia', () => {
    const result = serializeUserResponse({ ...rawUser, whatsapp: null });

    expect(result.whatsapp).toBe('');
  });

  it('mapeia pessoaId nulo para undefined', () => {
    const result = serializeUserResponse({ ...rawUser, pessoaId: null });

    expect(result.pessoaId).toBeUndefined();
    expect('pessoaId' in result).toBe(false);
  });

  it('passa a pessoa vinculada para o campo pessoa', () => {
    const pessoa = {
      id: 42,
      externalId: 'id-externo-1',
      nome: 'Carmem Hernandez',
      cpf: '77722233345',
    };

    const result = serializeUserResponse(
      { ...rawUser, pessoaId: 42 },
      pessoa,
    );

    expect(result.pessoaId).toBe(42);
    expect(result.pessoa).toEqual(pessoa);
  });

  it('mapeia as paróquias vinculadas a partir de usuarioParoquias', () => {
    const result = serializeUserResponse(rawUser);

    expect(result.paroquias).toHaveLength(1);
    expect(result.paroquias[0]).toMatchObject({
      id: 1,
      descricao: 'Paróquia São José',
    });
  });

  it('retorna lista vazia de paróquias quando o usuário não tem vínculos', () => {
    const result = serializeUserResponse({ ...rawUser, usuarioParoquias: [] });

    expect(result.paroquias).toEqual([]);
  });
});