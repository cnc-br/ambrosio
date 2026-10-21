/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from 'neocatecumenal';

export function serializeUserResponse(user: any, pessoa?: any): User {
  const { usuarioParoquias = [], ...raw } = user;

  const response: User = {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    whatsapp: raw.whatsapp ?? '',
    paroquias: usuarioParoquias.map(({ paroquia }) => paroquia),
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