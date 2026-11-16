import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service.js';
import { Prisma } from 'src/prisma/generated-client.js';
import { PessoaCasalRepository } from './pessoa-casal.repository.js';

describe('PessoaCasalRepository', () => {
  let repository: PessoaCasalRepository;
  let prismaMock: {
    pessoaCasal: {
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock = {
      pessoaCasal: {
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaCasalRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<PessoaCasalRepository>(PessoaCasalRepository);
  });

  it('deve delegar create ao Prisma com os dados do casal', async () => {
    const data: Prisma.pessoaCasalUncheckedCreateInput = {
      pessoaMaridoId: 1,
      pessoaMulherId: 2,
    };
    const casalCriado = { id: 10, ...data };
    prismaMock.pessoaCasal.create.mockResolvedValue(casalCriado);

    const result = await repository.create(data);

    expect(prismaMock.pessoaCasal.create).toHaveBeenCalledWith({ data });
    expect(result).toBe(casalCriado);
  });

  it('deve delegar findFirst com o where informado', async () => {
    const where: Prisma.pessoaCasalWhereInput = { pessoaMaridoId: 1 };
    const casal = { id: 10, pessoaMaridoId: 1, pessoaMulherId: 2 };
    prismaMock.pessoaCasal.findFirst.mockResolvedValue(casal);

    const result = await repository.findFirst(where);

    expect(prismaMock.pessoaCasal.findFirst).toHaveBeenCalledWith({ where });
    expect(result).toBe(casal);
  });

  it('deve propagar erros do Prisma sem tradução', async () => {
    const erro = Object.assign(
      new Error("O registro de 'pessoaCasal' não foi encontrado."),
      { code: 'P2025' },
    );
    prismaMock.pessoaCasal.create.mockRejectedValue(erro);

    await expect(
      repository.create({ pessoaMaridoId: 1, pessoaMulherId: 2 }),
    ).rejects.toBe(erro);
  });
});