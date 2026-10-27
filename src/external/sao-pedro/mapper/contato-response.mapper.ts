import { PessoaContato } from 'neocatecumenal';

/** Shape bruto retornado pela API São Pedro (snake_case). */
export interface ExternalContatoResponse {
  id: number;
  pessoa_id: number;
  tipo_telefone: string | null;
  telefone: string | null;
  email?: string | null;
  observacao?: string | null;
  contato_principal: boolean;
}

export class ContatoResponseMapper {
  static toDomain(external: ExternalContatoResponse): PessoaContato {
    return {
      id: external.id,
      pessoaId: external.pessoa_id,
      tipoTelefone: external.tipo_telefone,
      telefone: external.telefone,
      ...(external.email !== undefined ? { email: external.email } : {}),
      ...(external.observacao !== undefined
        ? { observacao: external.observacao }
        : {}),
      contatoPrincipal: external.contato_principal,
    };
  }

  static toDomainList(
    externalList: ExternalContatoResponse[],
  ): PessoaContato[] {
    return externalList.map((external) => this.toDomain(external));
  }
}
