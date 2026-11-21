import 'reflect-metadata';
import { ForbiddenException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import type { user } from 'src/prisma/generated-client.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

const usuario = { id: 'usuario-admin' } as unknown as user;

const indicadores = {
  pessoas: { total: 10, ativas: 7, inativas: 3 },
  paroquias: 12,
  dioceses: 2,
  comunidades: 30,
  equipes: 8,
  carismas: { total: 4, vinculos: 15 },
  usuarios: { total: 5, porPapel: {} },
} as never;

describe('DashboardController', () => {
  let controller: DashboardController;
  let getIndicators: ReturnType<typeof vi.fn>;
  let can: ReturnType<typeof vi.fn>;
  let loggerWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    getIndicators = vi.fn().mockResolvedValue(indicadores);
    can = vi.fn().mockReturnValue(true);
    loggerWarn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: { getIndicators },
        },
        { provide: JwtService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        {
          provide: CaslAbilityService,
          useValue: { ability: { can } },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('protege a rota com AuthGuard e RoleGuard', () => {
    const guards =
      (Reflect.getMetadata('__guards__', DashboardController) as unknown[]) ??
      [];

    expect(guards).toEqual([AuthGuard, RoleGuard]);
  });

  it('delega ao service quando a ability permite ler pessoa', async () => {
    await expect(controller.getIndicators(usuario)).resolves.toBe(indicadores);

    expect(can).toHaveBeenCalledWith('read', 'pessoa');
    expect(getIndicators).toHaveBeenCalledTimes(1);
  });

  it('bloqueia com ForbiddenException quando a ability nega', () => {
    can.mockReturnValue(false);

    expect(() => controller.getIndicators(usuario)).toThrow(ForbiddenException);
    expect(getIndicators).not.toHaveBeenCalled();
  });

  it('registra no log o usuário autenticado quando o acesso é negado', () => {
    can.mockReturnValue(false);

    expect(() => controller.getIndicators(usuario)).toThrow(ForbiddenException);
    expect(loggerWarn).toHaveBeenCalledWith(
      expect.stringContaining(usuario.id),
    );
  });
});
