import { Test, TestingModule } from '@nestjs/testing';
import { LocalidadeService } from './localidade.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';

describe('LocalidadeService', () => {
  let service: LocalidadeService;
  let prismaService: PrismaService;
  let enderecoService: EnderecoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalidadeService,
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            findFirstOrThrow: vi.fn(),
          },
        },
        {
          provide: EnderecoService,
          useValue: {
            createByPessoaId: vi.fn(),
            create: vi.fn(),
            findAllByPessoaId: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocalidadeService>(LocalidadeService);
    prismaService = module.get<PrismaService>(PrismaService);
    enderecoService = module.get<EnderecoService>(EnderecoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(enderecoService).toBeDefined();
  });

  it('create grava a autoria e repassa o usuário ao endereço', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const enderecoCreate = vi.fn().mockResolvedValue({ id: 9 });
    const modulo = new LocalidadeService(
      { localidade: { create } } as never,
      { create: enderecoCreate } as never,
    );

    await modulo.create(
      {
        descricao: 'Localidade Nova',
        diocese: { id: 1 },
        tipoLocalidade: { id: 2 },
        endereco: { cep: '13208200' },
      } as never,
      'usuario-autor',
    );

    expect(enderecoCreate).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      'usuario-autor',
    );
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cadastradoPorId: 'usuario-autor',
        atualizadoPorId: 'usuario-autor',
      }),
    });
  });
});
