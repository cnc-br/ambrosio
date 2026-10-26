import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';

describe('ContatoService', () => {
  let service: ContatoService;

  const tx = {
    pessoa: { findUniqueOrThrow: vi.fn() },
    pessoaContato: { updateMany: vi.fn(), create: vi.fn() },
  };
  const prismaMock = {
    $transaction: vi.fn(async (fn: (client: typeof tx) => unknown) =>
      fn(tx),
    ),
  };
  const abilityMock = {
    ability: { can: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    abilityMock.ability.can.mockReturnValue(true);
    tx.pessoa.findUniqueOrThrow.mockResolvedValue({ id: 1 });
    tx.pessoaContato.create.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ({ data }: { data: Record<string, any> }) => ({ id: 1, ...data }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContatoService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: CaslAbilityService, useValue: abilityMock },
      ],
    }).compile();

    service = module.get<ContatoService>(ContatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deve lançar ForbiddenException sem permissão de create pessoa', async () => {
    abilityMock.ability.can.mockReturnValue(false);

    await expect(
      service.create(1, { telefoneCelular: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('deve criar contato sem contatoPrincipal sem chamar updateMany', async () => {
    const dto: CreatePessoaContatoDto = {
      telefoneCelular: '11999999999',
      email: 'contato@exemplo.com',
    };

    const result = await service.create(1, dto);

    expect(tx.pessoa.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(tx.pessoaContato.updateMany).not.toHaveBeenCalled();
    expect(tx.pessoaContato.create).toHaveBeenCalledWith({
      data: { pessoaId: 1, ...dto },
    });
    expect(result).toEqual({ id: 1, pessoaId: 1, ...dto });
  });

  it('deve rebaixar o principal anterior quando contatoPrincipal é true', async () => {
    const dto: CreatePessoaContatoDto = {
      email: 'principal@exemplo.com',
      contatoPrincipal: true,
    };

    const result = await service.create(1, dto);

    expect(tx.pessoaContato.updateMany).toHaveBeenCalledWith({
      where: { pessoaId: 1, contatoPrincipal: true },
      data: { contatoPrincipal: false },
    });
    expect(tx.pessoaContato.create).toHaveBeenCalledWith({
      data: { pessoaId: 1, ...dto },
    });
    expect(result).toEqual({ id: 1, pessoaId: 1, ...dto });
  });

  it('deve executar updateMany antes do create na transação', async () => {
    await service.create(1, { contatoPrincipal: true });

    const updateManyOrder = tx.pessoaContato.updateMany.mock
      .invocationCallOrder[0];
    const createOrder = tx.pessoaContato.create.mock.invocationCallOrder[0];

    expect(updateManyOrder).toBeLessThan(createOrder);
  });

  it('deve propagar erro de pessoa inexistente (P2025) sem criar contato', async () => {
    const notFoundError = Object.assign(
      new Error('O registro de Pessoa não foi encontrado.'),
      { code: 'P2025' },
    );
    tx.pessoa.findUniqueOrThrow.mockRejectedValue(notFoundError);

    await expect(
      service.create(999, { telefoneCelular: '11999999999' }),
    ).rejects.toBe(notFoundError);

    expect(tx.pessoaContato.updateMany).not.toHaveBeenCalled();
    expect(tx.pessoaContato.create).not.toHaveBeenCalled();
  });
});