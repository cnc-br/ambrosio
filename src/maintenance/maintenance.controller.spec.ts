import { ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import type { user } from 'src/prisma/generated-client.js';
import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceService } from './maintenance.service.js';

const usuario = {
  id: 'usuario-admin',
  role: UserRoleEnum.ADMIN,
} as unknown as user;

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let findAll: ReturnType<typeof vi.fn>;
  let deleteHistory: ReturnType<typeof vi.fn>;
  let can: ReturnType<typeof vi.fn>;
  let loggerWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    findAll = vi.fn();
    deleteHistory = vi.fn();
    can = vi.fn().mockReturnValue(true);
    loggerWarn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: { findAll, deleteHistory },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        {
          provide: CaslAbilityService,
          useValue: { ability: { can } },
        },
      ],
    }).compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delega a listagem ao service com page e limit', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll(usuario, { page: 2, limit: 10 });

    expect(findAll).toHaveBeenCalledWith(2, 10);
  });

  it('delega a exclusão do histórico ao service', async () => {
    deleteHistory.mockResolvedValue({ deleted: 3 });

    await expect(controller.removeHistory(usuario)).resolves.toEqual({
      deleted: 3,
    });
    expect(deleteHistory).toHaveBeenCalledTimes(1);
  });

  it('exige o papel ADMIN no GET e no DELETE', () => {
    expect(
      Reflect.getMetadata(
        'roles',
        MaintenanceController.prototype.findAll,
      ),
    ).toEqual([UserRoleEnum.ADMIN]);
    expect(
      Reflect.getMetadata(
        'roles',
        MaintenanceController.prototype.removeHistory,
      ),
    ).toEqual([UserRoleEnum.ADMIN]);
  });

  it('autoriza a listagem pela ability CASL de scheduledJobExecution', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll(usuario, {});

    expect(can).toHaveBeenCalledWith('read', 'scheduledJobExecution');
  });

  it('autoriza a exclusão pela ability CASL de scheduledJobExecution', async () => {
    deleteHistory.mockResolvedValue({ deleted: 0 });

    await controller.removeHistory(usuario);

    expect(can).toHaveBeenCalledWith('delete', 'scheduledJobExecution');
  });

  it('bloqueia a listagem quando a ability CASL nega e não chama o service', () => {
    can.mockReturnValue(false);

    expect(() => controller.findAll(usuario, {})).toThrow(ForbiddenException);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('bloqueia a exclusão quando a ability CASL nega e não chama o service', () => {
    can.mockReturnValue(false);

    expect(() => controller.removeHistory(usuario)).toThrow(ForbiddenException);
    expect(deleteHistory).not.toHaveBeenCalled();
  });

  it('registra no log o usuário autenticado quando o acesso é negado', () => {
    can.mockReturnValue(false);

    expect(() => controller.removeHistory(usuario)).toThrow(ForbiddenException);
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining('usuario-admin'),
    );
  });
});
