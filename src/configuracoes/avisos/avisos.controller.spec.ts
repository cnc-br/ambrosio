import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { AvisosController } from './avisos.controller.js';
import { AvisosService } from './avisos.service.js';

const getGuards = (handler: (...args: unknown[]) => unknown) =>
  (Reflect.getMetadata('__guards__', handler) as object[] | undefined) ?? [];

const getRequiredRoles = (handler: (...args: unknown[]) => unknown) =>
  Reflect.getMetadata('roles', handler);

describe('AvisosController', () => {
  let controller: AvisosController;
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
      controllers: [AvisosController],
      providers: [
        {
          provide: AvisosService,
          useValue: { create, findAll, findOne, update },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: CaslAbilityService, useValue: {} },
      ],
    }).compile();

    controller = module.get<AvisosController>(AvisosController);
  });

  it('delega a criação ao service com o CreateAvisoDto', async () => {
    const dto = { texto: 'Novo aviso', dataFim: '2026-12-31T23:59:59.000Z' };
    create.mockResolvedValue({ id: 1, ...dto });

    await controller.create(dto);

    expect(create).toHaveBeenCalledWith(dto);
  });

  it('delega a listagem ao service', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll();

    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('delega a busca individual ao service convertendo o id para número', async () => {
    findOne.mockResolvedValue({});

    await controller.findOne('9' as unknown as number);

    expect(findOne).toHaveBeenCalledWith(9);
  });

  it('delega a atualização ao service convertendo o id para número', async () => {
    const dto = { texto: 'Texto novo' };
    update.mockResolvedValue({ id: 9, ...dto });

    await controller.update('9' as unknown as number, dto);

    expect(update).toHaveBeenCalledWith(9, dto);
  });

  it('exige autenticação e o papel ADMIN em POST /avisos', () => {
    expect(getGuards(AvisosController.prototype.create)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(AvisosController.prototype.create)).toEqual([
      UserRoleEnum.ADMIN,
    ]);
  });

  it('exige autenticação e o papel ADMIN em PATCH /avisos/:id', () => {
    expect(getGuards(AvisosController.prototype.update)).toEqual(
      expect.arrayContaining([AuthGuard, RoleGuard]),
    );
    expect(getRequiredRoles(AvisosController.prototype.update)).toEqual([
      UserRoleEnum.ADMIN,
    ]);
  });

  it('mantém GET /avisos e GET /avisos/:id públicos, sem guards nem papel', () => {
    expect(getGuards(AvisosController.prototype.findAll)).toHaveLength(0);
    expect(getRequiredRoles(AvisosController.prototype.findAll)).toBeUndefined();

    expect(getGuards(AvisosController.prototype.findOne)).toHaveLength(0);
    expect(getRequiredRoles(AvisosController.prototype.findOne)).toBeUndefined();
  });
});
