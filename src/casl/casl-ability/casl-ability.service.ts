import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable, Scope } from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import {
  comunidade,
  carisma,
  diocese,
  equipe,
  estadoCivil,
  etapa,
  localidade,
  macroRegiao,
  paroquia,
  pessoa,
  regiao,
  ScheduledJobExecution,
  setor,
  user,
} from 'src/prisma/generated-client.js';

export type PermActions =
  | 'manage'
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'changePassword';

export type PermissionResource =
  | Subjects<{
    pessoa: pessoa;
    user: user;
    diocese: diocese;
    paroquia: paroquia;
    localidade: localidade;
    comunidade: comunidade;
    equipe: equipe;
    carisma: carisma;
    etapa: etapa;
    estadoCivil: estadoCivil;
    scheduledJobExecution: ScheduledJobExecution;
    macroRegiao: macroRegiao;
    regiao: regiao;
    setor: setor;
  }>
  | 'all';

export type AppAbility = PureAbility<
  [PermActions, PermissionResource],
  PrismaQuery
>;

export type DefinePermissions = (
  user,
  builder: AbilityBuilder<AppAbility>,
) => void;

export type PermissionSubject = Extract<PermissionResource, string>;

export type PermissionRule = {
  action: PermActions;
  subject: PermissionSubject;
  conditions?: PrismaQuery;
};

export type EscopoSecretaria = {
  paroquia: PrismaQuery;
  comunidade: PrismaQuery;
  etapa: PrismaQuery;
  pessoaUpdate: PrismaQuery;
};

type SecretariaUser = { id: string };

/**
 * Projeção única da condição de paróquia do `SECRETARIA_PAROQUIA`.
 */
const paroquiaDoUsuario = (user: SecretariaUser): PrismaQuery => ({
  usuarioParoquias: { some: { userId: user.id } },
});

/**
 * Projeção única da condição de paróquia do `SECRETARIA_CNC`, cujo escopo
 * alcança todas as paróquias dos setores vinculados a ele.
 */
const paroquiaDoSetor = (user: SecretariaUser): PrismaQuery => ({
  setor: { is: { usuarioSetores: { some: { userId: user.id } } } },
});

const comunidadeDe = (paroquia: PrismaQuery): PrismaQuery => ({
  paroquia: { is: paroquia },
});

const etapaDe = (paroquia: PrismaQuery): PrismaQuery => ({
  comunidade: { is: comunidadeDe(paroquia) },
});

/**
 * Atualização de pessoa permitida quando ela não tem vínculo ativo com
 * comunidade ou quando ao menos um vínculo ativo está no escopo do usuário.
 */
const pessoaUpdateDe = (paroquia: PrismaQuery): PrismaQuery => ({
  OR: [
    {
      comunidadePessoas: { none: { dataSaida: null } },
    },
    {
      comunidadePessoas: {
        some: {
          dataSaida: null,
          comunidade: { is: comunidadeDe(paroquia) },
        },
      },
    },
  ],
});

const escopoPorParoquia = (user: SecretariaUser): EscopoSecretaria => {
  const paroquia = paroquiaDoUsuario(user);
  return {
    paroquia,
    comunidade: comunidadeDe(paroquia),
    etapa: etapaDe(paroquia),
    pessoaUpdate: pessoaUpdateDe(paroquia),
  };
};

const escopoPorSetor = (user: SecretariaUser): EscopoSecretaria => {
  const paroquia = paroquiaDoSetor(user);
  return {
    paroquia,
    comunidade: comunidadeDe(paroquia),
    etapa: etapaDe(paroquia),
    pessoaUpdate: pessoaUpdateDe(paroquia),
  };
};

/**
 * Base única de capacidades compartilhada pelos perfis de secretaria.
 * Uma nova capacidade de secretaria entra aqui uma vez e vale para
 * `SECRETARIA_PAROQUIA` e `SECRETARIA_CNC` no escopo de cada um.
 */
const permissoesSecretaria = (
  escopo: EscopoSecretaria,
): PermissionRule[] => [
  { action: 'read', subject: 'pessoa' },
  { action: 'create', subject: 'pessoa' },
  {
    action: 'update',
    subject: 'pessoa',
    conditions: escopo.pessoaUpdate,
  },
  { action: 'read', subject: 'estadoCivil' },
  { action: 'read', subject: 'carisma' },
  { action: 'read', subject: 'diocese' },
  { action: 'read', subject: 'localidade' },
  { action: 'read', subject: 'paroquia', conditions: escopo.paroquia },
  {
    action: 'read',
    subject: 'comunidade',
    conditions: escopo.comunidade,
  },
  {
    action: 'create',
    subject: 'comunidade',
    conditions: escopo.comunidade,
  },
  {
    action: 'update',
    subject: 'comunidade',
    conditions: escopo.comunidade,
  },
  { action: 'create', subject: 'etapa', conditions: escopo.etapa },
  { action: 'update', subject: 'etapa', conditions: escopo.etapa },
];

const aplicarPermissoes = (
  builder: AbilityBuilder<AppAbility>,
  regras: PermissionRule[],
) => {
  for (const { action, subject, conditions } of regras) {
    if (conditions) {
      builder.can(action, subject, conditions);
    } else {
      builder.can(action, subject);
    }
  }
};

// TODO: renomear essa funcao para algo comum que todos podem acessar
const grantReadPessoaDiocese: DefinePermissions = (user, { can }) => {
  can('read', 'pessoa');
  can('read', 'diocese');
  can('read', 'estadoCivil');
};

const secretariaPorParoquia: DefinePermissions = (user, builder) => {
  aplicarPermissoes(builder, permissoesSecretaria(escopoPorParoquia(user)));
};

const secretariaPorSetor: DefinePermissions = (user, builder) => {
  const escopo = escopoPorSetor(user);
  aplicarPermissoes(builder, permissoesSecretaria(escopo));
  // Capacidades exclusivas do SECRETARIA_CNC: gestão de paróquias dentro do
  // próprio setor, CRUD irrestrito de diocese (a leitura já vem da base) e
  // manutenção nacional da hierarquia do mapa (macro-região, região e setor).
  aplicarPermissoes(builder, [
    { action: 'create', subject: 'diocese' },
    { action: 'update', subject: 'diocese' },
    { action: 'delete', subject: 'diocese' },
    { action: 'create', subject: 'paroquia' },
    { action: 'update', subject: 'paroquia', conditions: escopo.paroquia },
    { action: 'delete', subject: 'paroquia', conditions: escopo.paroquia },
    { action: 'create', subject: 'macroRegiao' },
    { action: 'update', subject: 'macroRegiao' },
    { action: 'create', subject: 'regiao' },
    { action: 'update', subject: 'regiao' },
    { action: 'create', subject: 'setor' },
    { action: 'update', subject: 'setor' },
  ]);
};

const rolePermissionsMap: Record<UserRoleEnum, DefinePermissions> = {
  ADMIN(user, { can }) {
    can('manage', 'all');
  },
  NAO_IDENTIFICADO(user, { cannot }) {
    cannot('read', 'pessoa');
    cannot('create', 'pessoa');
    cannot('update', 'pessoa');
    cannot('delete', 'pessoa');
    cannot('read', 'diocese');
    cannot('create', 'diocese');
    cannot('update', 'diocese');
    cannot('delete', 'diocese');
    cannot('read', 'paroquia');
    cannot('create', 'paroquia');
    cannot('update', 'paroquia');
    cannot('delete', 'paroquia');
    cannot('read', 'localidade');
    cannot('read', 'user');
    cannot('create', 'user');
    cannot('update', 'user');
    cannot('delete', 'user');
    cannot('read', 'equipe');
    cannot('create', 'comunidade');
    cannot('update', 'comunidade');
    cannot('delete', 'comunidade');
    cannot('read', 'carisma');
    cannot('create', 'carisma');
    cannot('update', 'carisma');
    cannot('delete', 'carisma');
    cannot('read', 'etapa');
    cannot('create', 'etapa');
    cannot('update', 'etapa');
    cannot('delete', 'etapa');
  },
  CATEQUISTA_NACIONAL: grantReadPessoaDiocese,
  CATEQUISTA_GRANDE_REGIAO: grantReadPessoaDiocese,
  CATEQUISTA_SETOR: grantReadPessoaDiocese,
  CATEQUISTA_REGIAO: grantReadPessoaDiocese,
  CATEQUISTA_PAROQUIA: grantReadPessoaDiocese,
  SECRETARIA_PAROQUIA: secretariaPorParoquia,
  SECRETARIA_CNC: secretariaPorSetor,
};

@Injectable({ scope: Scope.REQUEST })
export class CaslAbilityService {
  ability: AppAbility;
  userId: string;

  createForUser(user: user) {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
    builder.can('changePassword', 'user');
    rolePermissionsMap[user.role](user, builder);
    this.ability = builder.build();
    this.userId = user.id;

    return this.ability;
  }
}
