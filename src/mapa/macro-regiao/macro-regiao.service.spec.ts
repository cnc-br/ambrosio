import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { MacroRegiaoService } from './macro-regiao.service.js';

describe('MacroRegiaoService', () => {
  let service: MacroRegiaoService;
  let prisma: {
    macroRegiao: {
      findMany: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let ability: { can: ReturnType<typeof vi.fn> };

  const macroRegiao = {
    id: 1,
    descricao: 'Sudeste',
    ativo: true,
    cadastradoPorId: null,
    atualizadoPorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      macroRegiao: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    ability = { can: vi.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MacroRegiaoService,
        { provide: PrismaService, useValue: prisma },
        { provide: CaslAbilityService, useValue: { ability } },
      ],
    }).compile();

    service = module.get<MacroRegiaoService>(MacroRegiaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all macro-regioes', async () => {
      prisma.macroRegiao.findMany.mockResolvedValue([macroRegiao]);

      await expect(service.findAll()).resolves.toEqual([macroRegiao]);
      expect(prisma.macroRegiao.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a macro-regiao by id', async () => {
      prisma.macroRegiao.findUniqueOrThrow.mockResolvedValue(macroRegiao);

      await expect(service.findOne(1)).resolves.toEqual(macroRegiao);
      expect(prisma.macroRegiao.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('create', () => {
    it('cria a macro-regiao com a autoria do usuário autenticado', async () => {
      prisma.macroRegiao.create.mockResolvedValue(macroRegiao);

      await expect(
        service.create({ descricao: 'Sudeste' }, 'usuario-admin'),
      ).resolves.toEqual(macroRegiao);

      expect(ability.can).toHaveBeenCalledWith('create', 'macroRegiao');
      expect(prisma.macroRegiao.create).toHaveBeenCalledWith({
        data: {
          descricao: 'Sudeste',
          ativo: true,
          cadastradoPorId: 'usuario-admin',
          atualizadoPorId: 'usuario-admin',
        },
      });
    });

    it('respeita o ativo informado no payload', async () => {
      prisma.macroRegiao.create.mockResolvedValue({
        ...macroRegiao,
        ativo: false,
      });

      await service.create({ descricao: 'Sudeste', ativo: false }, 'usuario');

      expect(prisma.macroRegiao.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ativo: false }),
      });
    });

    it('grava autoria nula quando não há usuário autenticado', async () => {
      prisma.macroRegiao.create.mockResolvedValue(macroRegiao);

      await service.create({ descricao: 'Sudeste' });

      expect(prisma.macroRegiao.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: null,
          atualizadoPorId: null,
        }),
      });
    });

    it('nega a criação quando o usuário não tem a capacidade', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.create({ descricao: 'Sudeste' }, 'usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.macroRegiao.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza a macro-regiao e grava a autoria', async () => {
      const atualizada = { ...macroRegiao, descricao: 'Sudeste Brasileiro' };
      prisma.macroRegiao.findUniqueOrThrow.mockResolvedValue(macroRegiao);
      prisma.macroRegiao.update.mockResolvedValue(atualizada);

      await expect(
        service.update(
          1,
          { descricao: 'Sudeste Brasileiro', ativo: false },
          'usuario-admin',
        ),
      ).resolves.toEqual(atualizada);

      expect(ability.can).toHaveBeenCalledWith('update', 'macroRegiao');
      expect(prisma.macroRegiao.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.macroRegiao.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          descricao: 'Sudeste Brasileiro',
          ativo: false,
          atualizadoPorId: 'usuario-admin',
        },
      });
    });

    it('não envia campos ausentes no payload', async () => {
      prisma.macroRegiao.findUniqueOrThrow.mockResolvedValue(macroRegiao);
      prisma.macroRegiao.update.mockResolvedValue(macroRegiao);

      await service.update(1, { ativo: false }, 'usuario');

      expect(prisma.macroRegiao.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ativo: false, atualizadoPorId: 'usuario' },
      });
    });

    it('retorna 404 quando a macro-regiao não existe', async () => {
      prisma.macroRegiao.findUniqueOrThrow.mockRejectedValue(
        new Error('not found'),
      );

      await expect(
        service.update(999, { descricao: 'Inexistente' }, 'usuario'),
      ).rejects.toThrow('not found');
      expect(prisma.macroRegiao.update).not.toHaveBeenCalled();
    });

    it('nega a atualização quando o usuário não tem a capacidade', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.update(1, { descricao: 'Sudeste' }, 'usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.macroRegiao.update).not.toHaveBeenCalled();
    });
  });
});
