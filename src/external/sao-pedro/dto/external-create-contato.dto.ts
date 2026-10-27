import { TIPO_TELEFONE_ENUM } from 'src/commons/enums/enums.js';

export class ExternalCreateContatoDto {
  tipoTelefone?: TIPO_TELEFONE_ENUM;
  telefone?: string;
  email?: string;
  observacao?: string;
  contatoPrincipal?: boolean;
}