import { Test, TestingModule } from '@nestjs/testing';
import { accessibleBy } from '@casl/prisma';
import { UserRoleEnum } from 'neocatecumenal';
import { CaslAbilityService } from './casl-ability.service.js';

type AppUser = Parameters<CaslAbilityService['createForUser']>[0];

const usuario = (id: string, role: UserRoleEnum) =>
  ({ id, role }) as unknown as AppUser;

const escopoComunidade = (paroquia: object) => ({
  OR: [{ paroquia: { is: paroquia } }],
});

const escopoPessoaUpdate = (paroquia: object) => ({
  OR: [
    {
      OR: [
        { comunidadePessoas: { none: { dataSaida: null } } },
        {
          comunidadePessoas: {
            some: {
              dataSaida: null,
              comunidade: { is: { paroquia: { is: paroquia } } },
            },
          },
        },
      ],
    },
  ],
});

describe('CaslAbilityService', () => {
  let service: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaslAbilityService],
    }).compile();

    service = await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('SECRETARIA_PAROQUIA', () => {
    const paroquiaDoUsuario = {
      usuarioParoquias: { some: { userId: 'usuario-secretaria' } },
    };

    beforeEach(() => {
      service.createForUser(
        usuario('usuario-secretaria', UserRoleEnum.SECRETARIA_PAROQUIA),
      );
    });

    it('restringe a leitura e a escrita de comunidades às paróquias do usuário', () => {
      const condicaoEsperada = escopoComunidade(paroquiaDoUsuario);

      expect(accessibleBy(service.ability, 'read').comunidade).toEqual(
        condicaoEsperada,
      );
      expect(accessibleBy(service.ability, 'create').comunidade).toEqual(
        condicaoEsperada,
      );
      expect(accessibleBy(service.ability, 'update').comunidade).toEqual(
        condicaoEsperada,
      );
    });

    it('restringe a leitura de paróquias às paróquias do usuário', () => {
      expect(accessibleBy(service.ability, 'read').paroquia).toEqual({
        OR: [paroquiaDoUsuario],
      });
    });

    it('restringe a atualização de pessoa às paróquias do usuário', () => {
      expect(accessibleBy(service.ability, 'update').pessoa).toEqual(
        escopoPessoaUpdate(paroquiaDoUsuario),
      );
      expect(accessibleBy(service.ability, 'read').pessoa).toEqual({});
      expect(accessibleBy(service.ability, 'create').pessoa).toEqual({});
    });

    it('possui a base compartilhada de secretaria', () => {
      expect(service.ability.can('create', 'pessoa')).toBe(true);
      expect(service.ability.can('read', 'carisma')).toBe(true);
      expect(service.ability.can('read', 'localidade')).toBe(true);
      expect(service.ability.can('create', 'etapa')).toBe(true);
    });

    it('não gerencia paróquias', () => {
      expect(service.ability.can('create', 'paroquia')).toBe(false);
      expect(service.ability.can('update', 'paroquia')).toBe(false);
      expect(service.ability.can('delete', 'paroquia')).toBe(false);
    });

    it('não gerencia diocese', () => {
      expect(service.ability.can('read', 'diocese')).toBe(true);
      expect(service.ability.can('create', 'diocese')).toBe(false);
      expect(service.ability.can('update', 'diocese')).toBe(false);
      expect(service.ability.can('delete', 'diocese')).toBe(false);
    });

    it('não gerencia a hierarquia do mapa', () => {
      for (const subject of ['macroRegiao', 'regiao', 'setor'] as const) {
        expect(service.ability.can('create', subject)).toBe(false);
        expect(service.ability.can('update', subject)).toBe(false);
      }
    });
  });

  describe('SECRETARIA_CNC', () => {
    const paroquiaDaRegiao = {
      setor: {
        is: {
          regiao: {
            is: {
              usuarioRegioes: { some: { userId: 'usuario-secretaria-cnc' } },
            },
          },
        },
      },
    };

    beforeEach(() => {
      service.createForUser(
        usuario('usuario-secretaria-cnc', UserRoleEnum.SECRETARIA_CNC),
      );
    });

    it('restringe a leitura e a escrita de comunidades às regiões do usuário', () => {
      const condicaoEsperada = escopoComunidade(paroquiaDaRegiao);

      expect(accessibleBy(service.ability, 'read').comunidade).toEqual(
        condicaoEsperada,
      );
      expect(accessibleBy(service.ability, 'create').comunidade).toEqual(
        condicaoEsperada,
      );
      expect(accessibleBy(service.ability, 'update').comunidade).toEqual(
        condicaoEsperada,
      );
    });

    it('restringe a atualização de pessoa às regiões do usuário', () => {
      expect(accessibleBy(service.ability, 'update').pessoa).toEqual(
        escopoPessoaUpdate(paroquiaDaRegiao),
      );
      expect(accessibleBy(service.ability, 'read').pessoa).toEqual({});
      expect(accessibleBy(service.ability, 'create').pessoa).toEqual({});
    });

    it('possui a base compartilhada de secretaria', () => {
      expect(service.ability.can('create', 'pessoa')).toBe(true);
      expect(service.ability.can('read', 'carisma')).toBe(true);
      expect(service.ability.can('read', 'localidade')).toBe(true);
      expect(service.ability.can('create', 'etapa')).toBe(true);
    });

    it('gerencia paróquias somente dentro das regiões do usuário', () => {
      expect(service.ability.can('create', 'paroquia')).toBe(true);
      expect(accessibleBy(service.ability, 'update').paroquia).toEqual({
        OR: [paroquiaDaRegiao],
      });
      expect(accessibleBy(service.ability, 'delete').paroquia).toEqual({
        OR: [paroquiaDaRegiao],
      });
    });

    it('restringe a leitura de paróquias às regiões do usuário', () => {
      expect(accessibleBy(service.ability, 'read').paroquia).toEqual({
        OR: [paroquiaDaRegiao],
      });
    });

    it('gerencia diocese (CRUD)', () => {
      expect(service.ability.can('read', 'diocese')).toBe(true);
      expect(service.ability.can('create', 'diocese')).toBe(true);
      expect(service.ability.can('update', 'diocese')).toBe(true);
      expect(service.ability.can('delete', 'diocese')).toBe(true);
    });

    it('gerencia a hierarquia do mapa (create/update)', () => {
      for (const subject of ['macroRegiao', 'regiao', 'setor'] as const) {
        expect(service.ability.can('create', subject)).toBe(true);
        expect(service.ability.can('update', subject)).toBe(true);
        expect(service.ability.can('delete', subject)).toBe(false);
      }
    });
  });

  it('não restringe a atualização de pessoa do ADMIN', () => {
    service.createForUser(usuario('usuario-admin', UserRoleEnum.ADMIN));

    expect(accessibleBy(service.ability, 'update').pessoa).toEqual({});
  });

  it('não permite que o NAO_IDENTIFICADO crie ou atualize pessoa', () => {
    service.createForUser(
      usuario('usuario-nao-identificado', UserRoleEnum.NAO_IDENTIFICADO),
    );

    expect(service.ability.can('create', 'pessoa')).toBe(false);
    expect(service.ability.can('update', 'pessoa')).toBe(false);
  });

  it('não permite que o NAO_IDENTIFICADO gerencie a hierarquia do mapa', () => {
    service.createForUser(
      usuario('usuario-nao-identificado', UserRoleEnum.NAO_IDENTIFICADO),
    );

    for (const subject of ['macroRegiao', 'regiao', 'setor'] as const) {
      expect(service.ability.can('create', subject)).toBe(false);
      expect(service.ability.can('update', subject)).toBe(false);
    }
  });

  it('não restringe a leitura de comunidades do ADMIN', () => {
    service.createForUser(usuario('usuario-admin', UserRoleEnum.ADMIN));

    expect(accessibleBy(service.ability, 'read').comunidade).toEqual({});
  });

  it('não restringe o cadastro e a atualização de comunidades do ADMIN', () => {
    service.createForUser(usuario('usuario-admin', UserRoleEnum.ADMIN));

    expect(accessibleBy(service.ability, 'create').comunidade).toEqual({});
    expect(accessibleBy(service.ability, 'update').comunidade).toEqual({});
  });

  it('permite ao ADMIN ler e excluir o histórico de execuções de manutenção', () => {
    service.createForUser(usuario('usuario-admin', UserRoleEnum.ADMIN));

    expect(service.ability.can('read', 'scheduledJobExecution')).toBe(true);
    expect(service.ability.can('delete', 'scheduledJobExecution')).toBe(true);
  });

  it.each([UserRoleEnum.SECRETARIA_PAROQUIA, UserRoleEnum.SECRETARIA_CNC])(
    'nega ao %s o acesso ao histórico de execuções de manutenção',
    (role) => {
      service.createForUser(usuario(`usuario-${role}`, role));

      expect(service.ability.can('read', 'scheduledJobExecution')).toBe(false);
      expect(service.ability.can('delete', 'scheduledJobExecution')).toBe(
        false,
      );
    },
  );

  it.each(Object.values(UserRoleEnum))(
    'permite que o perfil %s troque a própria senha',
    (role) => {
      service.createForUser(usuario(`usuario-${role}`, role));

      expect(service.ability.can('changePassword', 'user')).toBe(true);
    },
  );

  it.each(
    Object.values(UserRoleEnum).filter((role) => role !== UserRoleEnum.ADMIN),
  )(
    'não concede update user ao perfil %s por causa da troca de senha',
    (role) => {
      service.createForUser(usuario(`usuario-${role}`, role));

      expect(service.ability.can('update', 'user')).toBe(false);
    },
  );
});
