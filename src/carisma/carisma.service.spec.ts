import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CarismaService } from './carisma.service.js';

describe('CarismaService', () => {
  describe('addCarismaToPessoa', () => {
    let service: CarismaService;
    let prisma: {
      carisma: { findMany: ReturnType<typeof vi.fn> };
      pessoaCarisma: {
        findMany: ReturnType<typeof vi.fn>;
        createMany: ReturnType<typeof vi.fn>;
        deleteMany: ReturnType<typeof vi.fn>;
      };
    };
    let pessoaService: {
      validarPessoaDentroDoEscopoDeAtualizacao: ReturnType<typeof vi.fn>;
    };
    let ability: { can: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      prisma = {
        carisma: { findMany: vi.fn() },
        pessoaCarisma: {
          findMany: vi.fn(),
          createMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      };
      pessoaService = {
        validarPessoaDentroDoEscopoDeAtualizacao: vi.fn(),
      };
      ability = { can: vi.fn(() => true) };

      service = new CarismaService(
        prisma as never,
        pessoaService as never,
        { ability, userId: 'user-1' } as never,
      );
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('SECRETARIA_PAROQUIA dentro do escopo adiciona carismas', async () => {
      pessoaService.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue({
        id: 1,
      });
      prisma.carisma.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.pessoaCarisma.findMany.mockResolvedValue([]);
      prisma.pessoaCarisma.createMany.mockResolvedValue({ count: 1 });

      const result = await service.addCarismaToPessoa(1, {
        carismaIds: [10],
      });

      expect(result).toEqual({
        pessoaId: 1,
        adicionados: 1,
        removidos: 0,
        mantidos: 0,
        carismasFinais: [10],
      });
      expect(
        pessoaService.validarPessoaDentroDoEscopoDeAtualizacao,
      ).toHaveBeenCalledWith(1);
    });

    it('SECRETARIA_PAROQUIA fora do escopo lança 403 sem escrever', async () => {
      pessoaService.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
        new ForbiddenException('fora do escopo'),
      );

      await expect(
        service.addCarismaToPessoa(1, { carismaIds: [10] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.carisma.findMany).not.toHaveBeenCalled();
      expect(prisma.pessoaCarisma.deleteMany).not.toHaveBeenCalled();
      expect(prisma.pessoaCarisma.createMany).not.toHaveBeenCalled();
    });

    it('ADMIN atualiza carismas sem restrição', async () => {
      pessoaService.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue({
        id: 1,
      });
      prisma.carisma.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.pessoaCarisma.findMany.mockResolvedValue([]);
      prisma.pessoaCarisma.createMany.mockResolvedValue({ count: 1 });

      const result = await service.addCarismaToPessoa(1, {
        carismaIds: [10],
      });

      expect(result.adicionados).toBe(1);
    });

    it('pessoa sem vínculo ativo é aceita', async () => {
      pessoaService.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue({
        id: 1,
      });
      prisma.carisma.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.pessoaCarisma.findMany.mockResolvedValue([]);
      prisma.pessoaCarisma.createMany.mockResolvedValue({ count: 1 });

      const result = await service.addCarismaToPessoa(1, {
        carismaIds: [10],
      });

      expect(result.adicionados).toBe(1);
    });

    it('pessoa inexistente lança 404', async () => {
      pessoaService.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
        new NotFoundException('Pessoa não encontrada'),
      );

      await expect(
        service.addCarismaToPessoa(1, { carismaIds: [10] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('perfil sem permissão de update lança 403 sem validar escopo', async () => {
      ability.can.mockReturnValue(false);

      await expect(
        service.addCarismaToPessoa(1, { carismaIds: [10] }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(
        pessoaService.validarPessoaDentroDoEscopoDeAtualizacao,
      ).not.toHaveBeenCalled();
    });
  });

  describe('auditoria', () => {
    let service: CarismaService;
    let prisma: {
      carisma: {
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
      };
      pessoaCarisma: {
        findMany: ReturnType<typeof vi.fn>;
        createMany: ReturnType<typeof vi.fn>;
        deleteMany: ReturnType<typeof vi.fn>;
      };
    };

    beforeEach(() => {
      prisma = {
        carisma: {
          create: vi.fn().mockResolvedValue({ id: 1 }),
          update: vi.fn().mockResolvedValue({ id: 1 }),
          findMany: vi.fn(),
        },
        pessoaCarisma: {
          findMany: vi.fn(),
          createMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      };
      service = new CarismaService(
        prisma as never,
        {
          validarPessoaDentroDoEscopoDeAtualizacao: vi.fn(),
        } as never,
        { ability: { can: vi.fn(() => true) } } as never,
      );
    });

    it('create grava cadastradoPorId e atualizadoPorId do usuário autenticado', async () => {
      await service.create({ descricao: 'Catequista', tipo: 'SERVICO' } as never, 'usuario-autor');

      expect(prisma.carisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        }),
      });
    });

    it('create sem usuário grava auditoria nula', async () => {
      await service.create({ descricao: 'Catequista', tipo: 'SERVICO' } as never);

      expect(prisma.carisma.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: null,
          atualizadoPorId: null,
        }),
      });
    });

    it('update grava atualizadoPorId do usuário autenticado', async () => {
      await service.update(1, { descricao: 'Catequista' } as never, 'usuario-editor');

      expect(prisma.carisma.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ atualizadoPorId: 'usuario-editor' }),
      });
    });

    it('addCarismaToPessoa grava autoria em pessoaCarisma', async () => {
      prisma.carisma.findMany.mockResolvedValue([{ id: 10 }]);
      prisma.pessoaCarisma.findMany.mockResolvedValue([]);
      prisma.pessoaCarisma.createMany.mockResolvedValue({ count: 1 });

      await service.addCarismaToPessoa(1, { carismaIds: [10] }, 'usuario-autor');

      expect(prisma.pessoaCarisma.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            pessoaId: 1,
            carismaId: 10,
            cadastradoPorId: 'usuario-autor',
            atualizadoPorId: 'usuario-autor',
          }),
        ],
        skipDuplicates: true,
      });
    });
  });
});
