import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';

describe('ContatoService', () => {
  let service: ContatoService;

  const prismaMock = {
    pessoa: { findUniqueOrThrow: vi.fn() },
  };
  const saoPedroContatoServiceMock = {
    createExternalContato: vi.fn(),
  };
  const abilityMock = {
    ability: { can: vi.fn() },
  };

  const contatoCriado = {
    id: 1,
    pessoaId: 10,
    tipoTelefone: 'CELULAR',
    telefone: '11987654321',
    email: 'contato@exemplo.com',
    contatoPrincipal: true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    abilityMock.ability.can.mockReturnValue(true);
    prismaMock.pessoa.findUniqueOrThrow.mockResolvedValue({
      externalId: 'uuid-pessoa',
    });
    saoPedroContatoServiceMock.createExternalContato.mockResolvedValue(
      contatoCriado,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContatoService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: SaoPedroContatoService,
          useValue: saoPedroContatoServiceMock,
        },
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
      service.create(1, { telefone: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(prismaMock.pessoa.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('deve resolver a pessoa pelo id e delegar a criação à São Pedro com o externalId', async () => {
    const dto: CreatePessoaContatoDto = {
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
    };

    const result = await service.create(1, dto);

    expect(prismaMock.pessoa.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { externalId: true },
    });
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).toHaveBeenCalledWith('uuid-pessoa', dto);
    expect(result).toEqual(contatoCriado);
  });

  it('deve propagar erro de pessoa inexistente (P2025) sem chamar o serviço externo', async () => {
    const notFoundError = Object.assign(
      new Error('O registro de Pessoa não foi encontrado.'),
      { code: 'P2025' },
    );
    prismaMock.pessoa.findUniqueOrThrow.mockRejectedValue(notFoundError);

    await expect(
      service.create(999, { telefone: '11999999999' }),
    ).rejects.toBe(notFoundError);

    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
  });
});