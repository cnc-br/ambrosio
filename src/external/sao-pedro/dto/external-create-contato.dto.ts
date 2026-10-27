import { TIPO_TELEFONE_ENUM } from 'src/commons/enums/enums.js';

export class ExternalCreateContatoDto {
  tipo_telefone?: TIPO_TELEFONE_ENUM;
  telefone?: string;
  email?: string;
  observacao?: string;
  contato_principal?: boolean;
}