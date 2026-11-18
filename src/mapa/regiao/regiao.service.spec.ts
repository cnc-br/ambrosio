import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { MacroRegiaoService } from '../macro-regiao/macro-regiao.service.js';
import { RegiaoService } from './regiao.service.js';

describe('RegiaoService', () => {
  let service: RegiaoService;
  let prisma: {
    regiao: {
      findMany: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let macroRegiaoService: { findOne: ReturnType<typeof vi.fn> };
  let ability: { can: ReturnType<typeof vi.fn> };

  const macroRegiao = { id: 1, descricao: 'Sudeste', ativo: true };
  const regiao = {
    id: 1,
    descricao: 'Interior',
    ativo: true,
    macroRegiaoId: 1,
    macroRegiao,
    cadastradoPorId: null,
    atualizadoPorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      regiao: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    macroRegiaoService = { findOne: vi.fn() };
    ability = { can: vi.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegiaoService,
        { provide: PrismaService, useValue: prisma },
        { provide: MacroRegiaoService, useValue: macroRegiaoService },
        { provide: CaslAbilityService, useValue: { ability } },
      ],
    }).compile();

    service = module.get<RegiaoService>(RegiaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('retorna as regiões com a macro-região', async () => {
      prisma.regiao.findMany.mockResolvedValue([regiao]);

      await expect(service.findAll()).resolves.toEqual([regiao]);
      expect(prisma.regiao.findMany).toHaveBeenCalledWith({
        include: { macroRegiao: true },
      });
    });
  });

  describe('findOne', () => {
    it('retorna a região com a macro-região', async () => {
      prisma.regiao.findUniqueOrThrow.mockResolvedValue(regiao);

      await expect(service.findOne(1)).resolves.toEqual(regiao);
      expect(prisma.regiao.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { macroRegiao: true },
      });
    });
  });

  describe('create', () => {
    it('valida a macro-região e grava a autoria', async () => {
      macroRegiaoService.findOne.mockResolvedValue(macroRegiao);
      prisma.regiao.create.mockResolvedValue(regiao);

      await expect(
        service.create(
          { descricao: 'Interior', macroRegiao: { id: 1 } },
          'usuario-admin',
        ),
      ).resolves.toEqual(regiao);

      expect(ability.can).toHaveBeenCalledWith('create', 'regiao');
      expect(macroRegiaoService.findOne).toHaveBeenCalledWith(1);
      expect(prisma.regiao.create).toHaveBeenCalledWith({
        data: {
          descricao: 'Interior',
          ativo: true,
          macroRegiaoId: 1,
          cadastradoPorId: 'usuario-admin',
          atualizadoPorId: 'usuario-admin',
        },
        include: { macroRegiao: true },
      });
    });

    it('retorna 404 quando a macro-região não existe', async () => {
      macroRegiaoService.findOne.mockRejectedValue(new Error('not found'));

      await expect(
        service.create(
          { descricao: 'Interior', macroRegiao: { id: 999 } },
          'usuario',
        ),
      ).rejects.toThrow('not found');
      expect(prisma.regiao.create).not.toHaveBeenCalled();
    });

    it('nega a criação sem a capacidade CASL', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.create(
          { descricao: 'Interior', macroRegiao: { id: 1 } },
          'usuario',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.regiao.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('move a região de macro-região e grava a autoria', async () => {
      const atualizada = { ...regiao, macroRegiaoId: 3 };
      prisma.regiao.findUniqueOrThrow.mockResolvedValue(regiao);
      macroRegiaoService.findOne.mockResolvedValue({
        id: 3,
        descricao: 'Goiás',
        ativo: true,
      });
      prisma.regiao.update.mockResolvedValue(atualizada);

      await expect(
        service.update(1, { macroRegiao: { id: 3 } }, 'usuario-admin'),
      ).resolves.toEqual(atualizada);

      expect(ability.can).toHaveBeenCalledWith('update', 'regiao');
      expect(macroRegiaoService.findOne).toHaveBeenCalledWith(3);
      expect(prisma.regiao.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          macroRegiaoId: 3,
          atualizadoPorId: 'usuario-admin',
        },
        include: { macroRegiao: true },
      });
    });

    it('mantém a macro-região atual quando ela não é informada', async () => {
      prisma.regiao.findUniqueOrThrow.mockResolvedValue(regiao);
      prisma.regiao.update.mockResolvedValue(regiao);

      await service.update(1, { descricao: 'Interior Paulista' }, 'usuario');

      expect(macroRegiaoService.findOne).not.toHaveBeenCalled();
      expect(prisma.regiao.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          descricao: 'Interior Paulista',
          atualizadoPorId: 'usuario',
        },
        include: { macroRegiao: true },
      });
    });

    it('retorna 404 quando a região não existe', async () => {
      prisma.regiao.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(
        service.update(999, { descricao: 'Inexistente' }, 'usuario'),
      ).rejects.toThrow('not found');
      expect(prisma.regiao.update).not.toHaveBeenCalled();
    });

    it('retorna 404 quando a nova macro-região não existe', async () => {
      prisma.regiao.findUniqueOrThrow.mockResolvedValue(regiao);
      macroRegiaoService.findOne.mockRejectedValue(new Error('not found'));

      await expect(
        service.update(1, { macroRegiao: { id: 999 } }, 'usuario'),
      ).rejects.toThrow('not found');
      expect(prisma.regiao.update).not.toHaveBeenCalled();
    });

    it('nega a atualização sem a capacidade CASL', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.update(1, { descricao: 'Interior' }, 'usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.regiao.update).not.toHaveBeenCalled();
    });
  });
});
