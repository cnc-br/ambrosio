import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { RegiaoController } from './regiao.controller.js';
import { RegiaoService } from './regiao.service.js';

const getGuards = (handler: (...args: never[]) => unknown) =>
  (Reflect.getMetadata('__guards__', handler) as object[] | undefined) ?? [];

const getRequiredRoles = (handler: (...args: never[]) => unknown) =>
  Reflect.getMetadata('roles', handler);

describe('RegiaoController', () => {
  let controller: RegiaoController;
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
      controllers: [RegiaoController],
      providers: [
        {
          provide: RegiaoService,
          useValue: { create, findAll, findOne, update },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: CaslAbilityService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RegiaoController>(RegiaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delega a listagem ao service', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('delega a busca individual ao service com o id numérico', async () => {
    findOne.mockResolvedValue({});

    await controller.findOne('1');

    expect(findOne).toHaveBeenCalledWith(1);
  });

  it('rejeita id inválido na busca individual', () => {
    expect(() => controller.findOne('aaaa')).toThrow(BadRequestException);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('delega a criação ao service com o usuário autenticado', async () => {
    const dto = { descricao: 'Interior', macroRegiao: { id: 1 } };
    create.mockResolvedValue({ id: 1, ...dto });

    await controller.create(dto, 'usuario-admin');

    expect(create).toHaveBeenCalledWith(dto, 'usuario-admin');
  });

  it('delega a atualização ao service com o id numérico e o usuário', async () => {
    const dto = { descricao: 'Interior Paulista' };
    update.mockResolvedValue({ id: 1, ...dto });

    await controller.update('1', dto, 'usuario-admin');

    expect(update).toHaveBeenCalledWith(1, dto, 'usuario-admin');
  });

  it('exige autenticação e os papéis ADMIN/SECRETARIA_CNC em POST /regiao', () => {
    expect(getGuards(RegiaoController.prototype.create)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(RegiaoController.prototype.create)).toEqual([
      UserRoleEnum.ADMIN,
      UserRoleEnum.SECRETARIA_CNC,
    ]);
  });

  it('exige autenticação e os papéis ADMIN/SECRETARIA_CNC em PATCH /regiao/:id', () => {
    expect(getGuards(RegiaoController.prototype.update)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(RegiaoController.prototype.update)).toEqual([
      UserRoleEnum.ADMIN,
      UserRoleEnum.SECRETARIA_CNC,
    ]);
  });

  it('mantém GET /regiao e GET /regiao/:id públicos', () => {
    expect(getGuards(RegiaoController.prototype.findAll)).toHaveLength(0);
    expect(getRequiredRoles(RegiaoController.prototype.findAll)).toBeUndefined();

    expect(getGuards(RegiaoController.prototype.findOne)).toHaveLength(0);
    expect(getRequiredRoles(RegiaoController.prototype.findOne)).toBeUndefined();
  });
});
