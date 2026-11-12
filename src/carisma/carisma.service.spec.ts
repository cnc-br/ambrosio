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

    it('SECRETARIA_CNC dentro do escopo adiciona carismas', async () => {
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

    it('SECRETARIA_CNC fora do escopo lança 403 sem escrever', async () => {
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
});
