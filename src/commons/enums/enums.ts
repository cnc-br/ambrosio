import { EscolaridadeEnum, EstadoCivilEnum } from 'neocatecumenal';

export enum SEXO_ENUM {
  MASCULINO = 'MASCULINO',
  FEMININO = 'FEMININO',
}

export enum ETAPA_ENUM {
  PRE_CATECUMENATO = 1,
}

export enum TIPO_CARISMA_ENUM {
  PRIMITIVO = 'PRIMITIVO',
  SERVICO = 'SERVICO',
  VINCULADO = 'VINCULADO',
}

export enum TIPO_TELEFONE_ENUM {
  CELULAR = 'CELULAR',
  RESIDENCIAL = 'RESIDENCIAL',
  COMERCIAL = 'COMERCIAL',
}

export enum CARISMA_IDS_ENUM {
  CATEQUISTA = 13,
  FAMILIA_MISSAO = 3,
  FAMILIA_ITINERANTE = 6,
  POS_CRISMA = 7,
}

// Mapeamento para converter descricao para enum
export const ESCOLARIDADE_MAP: Record<string, EscolaridadeEnum> = {
  nao_informado: EscolaridadeEnum.NAO_INFORMADO,
  analfabeto: EscolaridadeEnum.ANALFABETO,
  fundamental: EscolaridadeEnum.FUNDAMENTAL,
  fundamental_incompleto: EscolaridadeEnum.FUNDAMENTAL_INCOMPLETO,
  medio: EscolaridadeEnum.MEDIO,
  medio_incompleto: EscolaridadeEnum.MEDIO_INCOMPLETO,
  superior: EscolaridadeEnum.SUPERIOR,
  superior_incompleto: EscolaridadeEnum.SUPERIOR_INCOMPLETO,
  pos_graduacao: EscolaridadeEnum.POS_GRADUACAO,
  mestrado: EscolaridadeEnum.MESTRADO,
  doutorado: EscolaridadeEnum.DOUTORADO,
  pos_doutorado: EscolaridadeEnum.POS_DOUTORADO,
};

export const ESTADO_CIVIL_MAP: Record<string, EstadoCivilEnum> = {
  S: EstadoCivilEnum.SOLTEIRO,
  C: EstadoCivilEnum.CASADO,
  D: EstadoCivilEnum.DIVORCIADO,
  V: EstadoCivilEnum.VIUVO,
  N: EstadoCivilEnum.NAO_INFORMADO,
};
