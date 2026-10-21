import { AbilityBuilder, PureAbility } from '@casl/ability';
import { createPrismaAbility, PrismaQuery, Subjects } from '@casl/prisma';
import { Injectable, Scope } from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import {
  comunidade,
  carisma,
  diocese,
  equipe,
  localidade,
  paroquia,
  pessoa,
  user,
  etapa,
} from 'src/prisma/generated-client.js';

export type PermActions = 'manage' | 'create' | 'read' | 'update' | 'delete';

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

// TODO: renomear essa funcao para algo comum que todos podem acessar
const grantReadPessoaDiocese: DefinePermissions = (user, { can }) => {
  can('read', 'pessoa');
  can('read', 'diocese');
};

const rolePermissionsMap: Record<UserRoleEnum, DefinePermissions> = {
  ADMIN(user, { can }) {
    can('manage', 'all');
  },
  NAO_IDENTIFICADO(user, { cannot }) {
    cannot('read', 'pessoa');
    cannot('read', 'diocese');
    cannot('read', 'paroquia');
    cannot('read', 'localidade');
    cannot('read', 'user');
    cannot('read', 'equipe');
    cannot('read', 'carisma');
  },
  CATEQUISTA_NACIONAL: grantReadPessoaDiocese,
  CATEQUISTA_GRANDE_REGIAO: grantReadPessoaDiocese,
  CATEQUISTA_SETOR: grantReadPessoaDiocese,
  CATEQUISTA_REGIAO: grantReadPessoaDiocese,
  CATEQUISTA_PAROQUIA: grantReadPessoaDiocese,
  SECRETARIA_PAROQUIA: grantReadPessoaDiocese,
  SECRETARIA_CNC(user, { can }) {
    can('read', 'pessoa');
    can('read', 'diocese');
    can('read', 'localidade');
    can('read', 'paroquia');
    can('read', 'comunidade', {
      paroquia: { is: { usuarioParoquias: { some: { userId: user.id } } } },
    });
  },
};

@Injectable({ scope: Scope.REQUEST })
export class CaslAbilityService {
  ability: AppAbility;

  createForUser(user: user) {
    const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
    rolePermissionsMap[user.role](user, builder);
    this.ability = builder.build();

    return this.ability;
  }
}
