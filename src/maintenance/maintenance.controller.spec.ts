import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceService } from './maintenance.service.js';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let findAll: ReturnType<typeof vi.fn>;
  let deleteHistory: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    findAll = vi.fn();
    deleteHistory = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: { findAll, deleteHistory },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: CaslAbilityService, useValue: {} },
      ],
    }).compile();

    controller = module.get<MaintenanceController>(MaintenanceController);
  });

  it('delega a listagem ao service com page e limit', async () => {
    findAll.mockResolvedValue([]);

    await controller.findAll({ page: 2, limit: 10 });

    expect(findAll).toHaveBeenCalledWith(2, 10);
  });

  it('delega a exclusão do histórico ao service', async () => {
    deleteHistory.mockResolvedValue({ deleted: 3 });

    await expect(controller.removeHistory()).resolves.toEqual({ deleted: 3 });
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
});
