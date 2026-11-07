// PRISMA EXCEPTION FILTER MODELS
export const MODEL_NAME_MAP: Record<string, string> = {
  cidade: 'Cidade',
  diocese: 'Diocese',
  endereco: 'Endereço',
  escolaridade: 'Escolaridade',
  estado: 'Estado',
  estadocivil: 'Estado Civil',
  localidade: 'Localidade',
  pais: 'País',
  paroquia: 'Paroquia',
  pessoa: 'Pessoa',
  situacaoreligiosa: 'Situação Religiosa',
  tipodiocese: 'Tipo de Diocese',
  user: 'Usuário',
  carisma: 'Carisma',
  setor: 'Setor',
  regiao: 'Região',
  macroregiao: 'Macro Região',
  comunidade: 'Comunidade',
  aviso: 'Aviso',
  // adicione mais conforme o projeto for crescendo
  // Atenção: os nomes devem ser tudo minúsculo e sem acentos
};

// PRISMA ERROR CODE EXCEPTION
export const VALUE_TOO_LONG = 'P2000';
export const RECORD_NOT_FOUND = 'P2001';
export const UNIQUE_CONSTRAINT_FAILED = 'P2002';
export const FOREIGN_KEY_CONSTRAINT = 'P2003';
export const RAW_QUERY_FAILED = 'P2010';
export const NULL_CONSTRAINT_VIOLATION = 'P2011';
export const MISSING_REQUIRED_VALUE = 'P2012';
export const MISSING_REQUIRED_ARGUMENT = 'P2013';
export const RELATION_VIOLATION = 'P2014';
export const RECORD_DOES_NOT_EXIST = 'P2025';

// CONTROLERS PAGINATION
export const LIMIT_DEFAULT = 50;
export const PAGE_DEFAULT = 1;

export const SEM_INFORMACAO = 'Sem informações ou não se aplica';