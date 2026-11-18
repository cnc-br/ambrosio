import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { SetorController } from './setor.controller.js';
import { SetorService } from './setor.service.js';

const getGuards = (handler: (...args: never[]) => unknown) =>
  (Reflect.getMetadata('__guards__', handler) as object[] | undefined) ?? [];

const getRequiredRoles = (handler: (...args: never[]) => unknown) =>
  Reflect.getMetadata('roles', handler);

describe('SetorController', () => {
  let controller: SetorController;
  let create: ReturnType<typeof vi.fn>;
  let findAll: ReturnType<typeof vi.fn>;
  let findOne: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    create = vi.fn();
    findAll = vi.fn();
    findOne = vi.fn();
    update = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetorController],
      providers: [
        {
          provide: SetorService,
          useValue: { create, findAll, findOne, update },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: CaslAbilityService, useValue: {} },
      ],
    }).compile();

    controller = module.get<SetorController>(SetorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega a listagem ao service convertendo regiaoId', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll('1');

    expect(findAll).toHaveBeenCalledWith(1);
  });

  it('delega a listagem sem filtro quando regiaoId não é informado', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(findAll).toHaveBeenCalledWith(undefined);
  });

  it('delega a busca individual ao service com o id numérico', async () => {
    findOne.mockResolvedValue({});

    await controller.findOne('1');

    expect(findOne).toHaveBeenCalledWith(1);
  });

  it('delega a criação ao service com o usuário autenticado', async () => {
    const dto = { descricao: 'Setor 10', regiao: { id: 1 } };
    create.mockResolvedValue({ id: 1, ...dto });

    await controller.create(dto, 'usuario-admin');

    expect(create).toHaveBeenCalledWith(dto, 'usuario-admin');
  });

  it('delega a atualização ao service com o id numérico e o usuário', async () => {
    const dto = { descricao: 'Setor 11' };
    update.mockResolvedValue({ id: 1, ...dto });

    await controller.update('1', dto, 'usuario-admin');

    expect(update).toHaveBeenCalledWith(1, dto, 'usuario-admin');
  });

  it('exige autenticação e os papéis ADMIN/SECRETARIA_CNC em POST /setor', () => {
    expect(getGuards(SetorController.prototype.create)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(SetorController.prototype.create)).toEqual([
      UserRoleEnum.ADMIN,
      UserRoleEnum.SECRETARIA_CNC,
    ]);
  });

  it('exige autenticação e os papéis ADMIN/SECRETARIA_CNC em PATCH /setor/:id', () => {
    expect(getGuards(SetorController.prototype.update)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(SetorController.prototype.update)).toEqual([
      UserRoleEnum.ADMIN,
      UserRoleEnum.SECRETARIA_CNC,
    ]);
  });

  it('mantém GET /setor e GET /setor/:id públicos', () => {
    expect(getGuards(SetorController.prototype.findAll)).toHaveLength(0);
    expect(getRequiredRoles(SetorController.prototype.findAll)).toBeUndefined();

    expect(getGuards(SetorController.prototype.findOne)).toHaveLength(0);
    expect(getRequiredRoles(SetorController.prototype.findOne)).toBeUndefined();
  });
});
