import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma.service.js';
import { Prisma } from 'src/prisma/generated-client.js';
import { PessoaRepository } from './pessoa.repository.js';
import {
  PESSOA_BASICA_SELECT,
  PESSOA_DETALHE_INCLUDE,
  PESSOA_LISTAGEM_INCLUDE,
} from './pessoa.includes.js';

describe('PessoaRepository', () => {
  let repository: PessoaRepository;
  let prismaMock: {
    pessoa: {
      create: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock = {
      pessoa: {
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaRepository,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    repository = module.get<PessoaRepository>(PessoaRepository);
  });

  it('deve delegar create ao Prisma com os dados informados', async () => {
    const data: Prisma.pessoaUncheckedCreateInput = {
      externalId: 'uuid-externo',
      situacaoReligiosaId: 1,
      cadastradoPorId: 'usuario-autor',
      atualizadoPorId: 'usuario-autor',
    };
    const pessoaCriada = { id: 1 };
    prismaMock.pessoa.create.mockResolvedValue(pessoaCriada);

    const result = await repository.create(data);

    expect(prismaMock.pessoa.create).toHaveBeenCalledWith({ data });
    expect(result).toBe(pessoaCriada);
  });

  it('deve delegar deletePorId ao Prisma e retornar void', async () => {
    prismaMock.pessoa.delete.mockResolvedValue({ id: 1 });

    const result = await repository.deletePorId(1);

    expect(prismaMock.pessoa.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBeUndefined();
  });

  it('deve delegar findManyParaListagem com where, paginação, include e ordenação', async () => {
    const where: Prisma.pessoaWhereInput = { ativo: true };
    const pessoas = [{ id: 1 }];
    prismaMock.pessoa.findMany.mockResolvedValue(pessoas);

    const result = await repository.findManyParaListagem({
      where,
      skip: 10,
      take: 5,
    });

    expect(prismaMock.pessoa.findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 5,
      where,
      include: PESSOA_LISTAGEM_INCLUDE,
      orderBy: { id: 'desc' },
    });
    expect(result).toBe(pessoas);
  });

  it('deve delegar findDetalhadoOrThrow com where unique e include de detalhe', async () => {
    const pessoaDetalhada = { id: 1 };
    prismaMock.pessoa.findUniqueOrThrow.mockResolvedValue(pessoaDetalhada);

    const result = await repository.findDetalhadoOrThrow({ id: 1 });

    expect(prismaMock.pessoa.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
      include: PESSOA_DETALHE_INCLUDE,
    });
    expect(result).toBe(pessoaDetalhada);
  });

  it('deve delegar findUniquePorExternalId com where externalId', async () => {
    const pessoa = { id: 1, externalId: 'uuid-externo' };
    prismaMock.pessoa.findUnique.mockResolvedValue(pessoa);

    const result = await repository.findUniquePorExternalId('uuid-externo');

    expect(prismaMock.pessoa.findUnique).toHaveBeenCalledWith({
      where: { externalId: 'uuid-externo' },
    });
    expect(result).toBe(pessoa);
  });

  it('deve delegar findBasicoPorIdOrThrow com select básico e where id', async () => {
    const pessoa = { id: 1, externalId: 'uuid-externo' };
    prismaMock.pessoa.findUniqueOrThrow.mockResolvedValue(pessoa);

    const result = await repository.findBasicoPorIdOrThrow(1);

    expect(prismaMock.pessoa.findUniqueOrThrow).toHaveBeenCalledWith({
      select: PESSOA_BASICA_SELECT,
      where: { id: 1 },
    });
    expect(result).toBe(pessoa);
  });

  it('deve delegar findNoEscopo com where combinando id e escopo', async () => {
    const escopo: Prisma.pessoaWhereInput = { ativo: true };
    const pessoa = { id: 1 };
    prismaMock.pessoa.findFirst.mockResolvedValue(pessoa);

    const result = await repository.findNoEscopo(1, escopo);

    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: { AND: [{ id: 1 }, escopo] },
    });
    expect(result).toBe(pessoa);
  });

  it('deve delegar findUniqueOrThrowPorId com where id', async () => {
    const pessoa = { id: 1 };
    prismaMock.pessoa.findUniqueOrThrow.mockResolvedValue(pessoa);

    const result = await repository.findUniqueOrThrowPorId(1);

    expect(prismaMock.pessoa.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(result).toBe(pessoa);
  });

  it('deve delegar findManyElegiveisCasal com select básico e where', async () => {
    const where: Prisma.pessoaWhereInput = { externalId: { in: ['uuid-1'] } };
    const pessoas = [{ id: 1, externalId: 'uuid-1' }];
    prismaMock.pessoa.findMany.mockResolvedValue(pessoas);

    const result = await repository.findManyElegiveisCasal({ where });

    expect(prismaMock.pessoa.findMany).toHaveBeenCalledWith({
      select: PESSOA_BASICA_SELECT,
      where,
    });
    expect(result).toBe(pessoas);
  });

  it('deve propagar erro P2025 de findUniqueOrThrow sem tradução', async () => {
    const notFoundError = Object.assign(
      new Error("O registro de 'Pessoa' não foi encontrado."),
      { code: 'P2025' },
    );
    prismaMock.pessoa.findUniqueOrThrow.mockRejectedValue(notFoundError);

    await expect(repository.findUniqueOrThrowPorId(999)).rejects.toBe(
      notFoundError,
    );
  });

  it('deve delegar updatePorId com where id e data', async () => {
    const data: Prisma.pessoaUncheckedUpdateInput = {
      atualizadoPorId: 'usuario-autor',
    };
    const pessoaAtualizada = { id: 1 };
    prismaMock.pessoa.update.mockResolvedValue(pessoaAtualizada);

    const result = await repository.updatePorId(1, data);

    expect(prismaMock.pessoa.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data,
    });
    expect(result).toBe(pessoaAtualizada);
  });
});