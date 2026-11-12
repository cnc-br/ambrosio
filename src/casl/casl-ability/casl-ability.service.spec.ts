import { Test, TestingModule } from '@nestjs/testing';
import { accessibleBy } from '@casl/prisma';
import { UserRoleEnum } from 'neocatecumenal';
import { CaslAbilityService } from './casl-ability.service.js';

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

  it('restringe a leitura de comunidades do SECRETARIA_CNC às paróquias do usuário', () => {
    const user = {
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    const where = accessibleBy(service.ability, 'read').comunidade;

    expect(where).toEqual({
      OR: [
        {
          paroquia: {
            is: {
              usuarioParoquias: { some: { userId: 'usuario-secretaria' } },
            },
          },
        },
      ],
    });
  });

  it('restringe o cadastro e a atualização de comunidades do SECRETARIA_CNC às paróquias do usuário', () => {
    const user = {
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    const condicaoEsperada = {
      OR: [
        {
          paroquia: {
            is: {
              usuarioParoquias: { some: { userId: 'usuario-secretaria' } },
            },
          },
        },
      ],
    };

    expect(accessibleBy(service.ability, 'create').comunidade).toEqual(
      condicaoEsperada,
    );
    expect(accessibleBy(service.ability, 'update').comunidade).toEqual(
      condicaoEsperada,
    );
  });

  it('permite que o SECRETARIA_CNC crie e atualize pessoa e mantenha a leitura', () => {
    const user = {
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(service.ability.can('create', 'pessoa')).toBe(true);
    expect(service.ability.can('update', 'pessoa')).toBe(true);
    expect(service.ability.can('read', 'pessoa')).toBe(true);
  });

  it('restringe a atualização de pessoa do SECRETARIA_CNC às paróquias do usuário', () => {
    const user = {
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(accessibleBy(service.ability, 'update').pessoa).toEqual({
      OR: [
        {
          OR: [
            {
              comunidadePessoas: { none: { dataSaida: null } },
            },
            {
              comunidadePessoas: {
                some: {
                  dataSaida: null,
                  comunidade: {
                    is: {
                      paroquia: {
                        is: {
                          usuarioParoquias: {
                            some: { userId: 'usuario-secretaria' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    });
    expect(accessibleBy(service.ability, 'read').pessoa).toEqual({});
    expect(accessibleBy(service.ability, 'create').pessoa).toEqual({});
  });

  it('não restringe a atualização de pessoa do ADMIN', () => {
    const user = {
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(accessibleBy(service.ability, 'update').pessoa).toEqual({});
  });

  it('não permite que o NAO_IDENTIFICADO crie ou atualize pessoa', () => {
    const user = {
      id: 'usuario-nao-identificado',
      role: UserRoleEnum.NAO_IDENTIFICADO,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(service.ability.can('create', 'pessoa')).toBe(false);
    expect(service.ability.can('update', 'pessoa')).toBe(false);
  });

  it('não restringe a leitura de comunidades do ADMIN', () => {
    const user = {
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(accessibleBy(service.ability, 'read').comunidade).toEqual({});
  });

  it('não restringe o cadastro e a atualização de comunidades do ADMIN', () => {
    const user = {
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(accessibleBy(service.ability, 'create').comunidade).toEqual({});
    expect(accessibleBy(service.ability, 'update').comunidade).toEqual({});
  });

  it('permite ao ADMIN ler e excluir o histórico de execuções de manutenção', () => {
    const user = {
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(service.ability.can('read', 'scheduledJobExecution')).toBe(true);
    expect(service.ability.can('delete', 'scheduledJobExecution')).toBe(true);
  });

  it('nega ao SECRETARIA_CNC o acesso ao histórico de execuções de manutenção', () => {
    const user = {
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0];

    service.createForUser(user);

    expect(service.ability.can('read', 'scheduledJobExecution')).toBe(false);
    expect(service.ability.can('delete', 'scheduledJobExecution')).toBe(false);
  });
});

