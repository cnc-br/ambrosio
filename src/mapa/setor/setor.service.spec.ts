import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { RegiaoService } from '../regiao/regiao.service.js';
import { SetorService } from './setor.service.js';

describe('SetorService', () => {
  let service: SetorService;
  let prisma: {
    setor: {
      findMany: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let regiaoService: { findOne: ReturnType<typeof vi.fn> };
  let ability: { can: ReturnType<typeof vi.fn> };

  const regiao = { id: 1, descricao: 'Interior', ativo: true, macroRegiaoId: 1 };
  const setor = {
    id: 1,
    descricao: 'Setor 10',
    ativo: true,
    regiaoId: 1,
    regiao,
    cadastradoPorId: null,
    atualizadoPorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      setor: {
        findMany: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };
    regiaoService = { findOne: vi.fn() };
    ability = { can: vi.fn().mockReturnValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetorService,
        { provide: PrismaService, useValue: prisma },
        { provide: RegiaoService, useValue: regiaoService },
        { provide: CaslAbilityService, useValue: { ability } },
      ],
    }).compile();

    service = module.get<SetorService>(SetorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('retorna os setores com a região', async () => {
      prisma.setor.findMany.mockResolvedValue([setor]);

      await expect(service.findAll()).resolves.toEqual([setor]);
      expect(prisma.setor.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: { regiao: true },
      });
    });

    it('filtra por região quando informado', async () => {
      prisma.setor.findMany.mockResolvedValue([setor]);

      await service.findAll(1);

      expect(prisma.setor.findMany).toHaveBeenCalledWith({
        where: { regiaoId: 1 },
        include: { regiao: true },
      });
    });
  });

  describe('findOne', () => {
    it('retorna o setor com a região', async () => {
      prisma.setor.findUniqueOrThrow.mockResolvedValue(setor);

      await expect(service.findOne(1)).resolves.toEqual(setor);
      expect(prisma.setor.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { regiao: true },
      });
    });
  });

  describe('create', () => {
    it('valida a região e grava a autoria', async () => {
      regiaoService.findOne.mockResolvedValue(regiao);
      prisma.setor.create.mockResolvedValue(setor);

      await expect(
        service.create(
          { descricao: 'Setor 10', regiao: { id: 1 } },
          'usuario-admin',
        ),
      ).resolves.toEqual(setor);

      expect(ability.can).toHaveBeenCalledWith('create', 'setor');
      expect(regiaoService.findOne).toHaveBeenCalledWith(1);
      expect(prisma.setor.create).toHaveBeenCalledWith({
        data: {
          descricao: 'Setor 10',
          ativo: true,
          regiaoId: 1,
          cadastradoPorId: 'usuario-admin',
          atualizadoPorId: 'usuario-admin',
        },
        include: { regiao: true },
      });
    });

    it('retorna 404 quando a região não existe', async () => {
      regiaoService.findOne.mockRejectedValue(new Error('not found'));

      await expect(
        service.create(
          { descricao: 'Setor 10', regiao: { id: 999 } },
          'usuario',
        ),
      ).rejects.toThrow('not found');
      expect(prisma.setor.create).not.toHaveBeenCalled();
    });

    it('nega a criação sem a capacidade CASL', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.create(
          { descricao: 'Setor 10', regiao: { id: 1 } },
          'usuario',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.setor.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('move o setor de região e grava a autoria', async () => {
      const atualizado = { ...setor, regiaoId: 2 };
      prisma.setor.findUniqueOrThrow.mockResolvedValue(setor);
      regiaoService.findOne.mockResolvedValue({
        id: 2,
        descricao: 'Ceará',
        ativo: true,
        macroRegiaoId: 2,
      });
      prisma.setor.update.mockResolvedValue(atualizado);

      await expect(
        service.update(1, { regiao: { id: 2 } }, 'usuario-admin'),
      ).resolves.toEqual(atualizado);

      expect(ability.can).toHaveBeenCalledWith('update', 'setor');
      expect(regiaoService.findOne).toHaveBeenCalledWith(2);
      expect(prisma.setor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          regiaoId: 2,
          atualizadoPorId: 'usuario-admin',
        },
        include: { regiao: true },
      });
    });

    it('mantém a região atual quando ela não é informada', async () => {
      prisma.setor.findUniqueOrThrow.mockResolvedValue(setor);
      prisma.setor.update.mockResolvedValue({ ...setor, ativo: false });

      await service.update(1, { ativo: false }, 'usuario');

      expect(regiaoService.findOne).not.toHaveBeenCalled();
      expect(prisma.setor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ativo: false,
          atualizadoPorId: 'usuario',
        },
        include: { regiao: true },
      });
    });

    it('retorna 404 quando o setor não existe', async () => {
      prisma.setor.findUniqueOrThrow.mockRejectedValue(new Error('not found'));

      await expect(
        service.update(999, { descricao: 'Inexistente' }, 'usuario'),
      ).rejects.toThrow('not found');
      expect(prisma.setor.update).not.toHaveBeenCalled();
    });

    it('retorna 404 quando a nova região não existe', async () => {
      prisma.setor.findUniqueOrThrow.mockResolvedValue(setor);
      regiaoService.findOne.mockRejectedValue(new Error('not found'));

      await expect(
        service.update(1, { regiao: { id: 999 } }, 'usuario'),
      ).rejects.toThrow('not found');
      expect(prisma.setor.update).not.toHaveBeenCalled();
    });

    it('nega a atualização sem a capacidade CASL', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.update(1, { descricao: 'Setor 10' }, 'usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.setor.update).not.toHaveBeenCalled();
    });
  });
});
