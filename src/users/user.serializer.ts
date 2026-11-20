/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from 'neocatecumenal';

type UserResponse = User & {
  regioes: Array<{ id: number; descricao: string }>;
};

export function serializeUserResponse(user: any, pessoa?: any): UserResponse {
  const { usuarioParoquias = [], usuarioRegioes = [], ...raw } = user;

  const response: UserResponse = {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    whatsapp: raw.whatsapp ?? '',
    paroquias: usuarioParoquias.map(({ paroquia }) => paroquia),
    regioes: usuarioRegioes.map(({ regiao }) => regiao),
    verifiedWhatsapp: raw.verifiedWhatsapp,
    active: raw.active,
    createdAt: raw.createdAt,
  };

  if (raw.pessoaId) {
    response.pessoaId = raw.pessoaId;
  }

  if (pessoa) {
    response.pessoa = pessoa;
  }

  return response;
}
