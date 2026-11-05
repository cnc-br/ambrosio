import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { PessoaService } from './pessoa.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

describe('PessoaService', () => {
  let service: PessoaService;
  let prismaService: PrismaService;
  let situacaoReligiosaService: SituacaoReligiosaService;
  let saoPedroPessoaService: SaoPedroPessoaService;
  let saoPedroContatoService: SaoPedroContatoService;
  let abilityService: CaslAbilityService;

  const saoPedroContatoServiceMock = {
    findExternalContatos: vi.fn(),
    createExternalContato: vi.fn(),
  };
  const saoPedroPessoaServiceMock = {
    findAllPessoas: vi.fn().mockResolvedValue([]),
    getExternalPessoaByCpf: vi.fn(),
    findExternalPessoaByUuid: vi.fn(),
    createExternalPessoa: vi.fn(),
    updateExternalPessoa: vi.fn(),
  };
  const prismaMock = {
    create: vi.fn(),
    findFirstOrThrow: vi.fn(),
    pessoa: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const externalPessoa = {
    id: 999,
    externalId: 'uuid-externo',
    nome: 'Maria Silva',
    conhecidoPor: 'Maria',
    cpf: '12345678901',
    sexo: 'F',
    nacionalidade: 'brasileira',
    dataNascimento: new Date('1990-01-01'),
    foto: null,
    ativo: true,
    estadoCivil: 'SOLTEIRO',
    escolaridade: 'ANALFABETO',
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
  };

  const pessoaLocal = {
    id: 1,
    externalId: 'uuid-externo',
    ativo: true,
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
    pessoaCarismas: [],
    enderecos: [],
    comunidadePessoas: [],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoaService,
        CaslAbilityService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: SituacaoReligiosaService,
          useValue: {
            create: vi.fn(),
            findAll: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: SaoPedroPessoaService,
          useValue: saoPedroPessoaServiceMock,
        },
        {
          provide: SaoPedroContatoService,
          useValue: saoPedroContatoServiceMock,
        },
      ],
    }).compile();

    service = await module.resolve<PessoaService>(PessoaService);
    prismaService = module.get<PrismaService>(PrismaService);
    saoPedroPessoaService = module.get<SaoPedroPessoaService>(
      SaoPedroPessoaService,
    );
    saoPedroContatoService = module.get<SaoPedroContatoService>(
      SaoPedroContatoService,
    );
    situacaoReligiosaService = module.get<SituacaoReligiosaService>(
      SituacaoReligiosaService,
    );
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(situacaoReligiosaService).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(saoPedroPessoaService).toBeDefined();
    expect(saoPedroContatoService).toBeDefined();
  });

  it('analisarCPF deve rejeitar CPF com dígitos verificadores inválidos', async () => {
    await expect(service.analisarCPF('52998224724')).rejects.toThrow(
      BadRequestException,
    );
    expect(
      saoPedroPessoaServiceMock.getExternalPessoaByCpf,
    ).not.toHaveBeenCalled();
  });

  it('analisarCPF deve rejeitar CPFs com todos os dígitos iguais', async () => {
    await expect(service.analisarCPF('11111111111')).rejects.toThrow(
      BadRequestException,
    );
    expect(
      saoPedroPessoaServiceMock.getExternalPessoaByCpf,
    ).not.toHaveBeenCalled();
  });

  it('analisarCPF deve aceitar um CPF válido', async () => {
    await service.analisarCPF('52998224725');

    expect(
      saoPedroPessoaServiceMock.getExternalPessoaByCpf,
    ).toHaveBeenCalledWith('52998224725');
  });

  it('analisarCPF deve permitir CPF não informado', async () => {
    await service.analisarCPF(undefined);
    await service.analisarCPF('');
    await service.analisarCPF(null);

    expect(
      saoPedroPessoaServiceMock.getExternalPessoaByCpf,
    ).not.toHaveBeenCalled();
  });

  it('findOneByCpf deve incluir os contatos buscados na Sao Pedro', async () => {
    const contatos = [
      {
        id: 1,
        pessoaId: 999,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        contatoPrincipal: true,
      },
    ];

    saoPedroPessoaServiceMock.getExternalPessoaByCpf.mockResolvedValue(
      externalPessoa,
    );
    prismaMock.pessoa.findUnique.mockResolvedValue(pessoaLocal);
    saoPedroContatoServiceMock.findExternalContatos.mockResolvedValue(contatos);

    const result = await service.findOneByCpf('12345678901');

    expect(saoPedroContatoServiceMock.findExternalContatos).toHaveBeenCalledWith(
      'uuid-externo',
    );
    expect(result.contatos).toEqual(contatos);
  });

  it('findOneByCpf deve retornar contatos vazio quando a busca falha', async () => {
    saoPedroPessoaServiceMock.getExternalPessoaByCpf.mockResolvedValue(
      externalPessoa,
    );
    prismaMock.pessoa.findUnique.mockResolvedValue(pessoaLocal);
    saoPedroContatoServiceMock.findExternalContatos.mockRejectedValue(
      new Error('falha externa'),
    );

    const result = await service.findOneByCpf('12345678901');

    expect(result.contatos).toEqual([]);
  });

  it('update deve negar quando o usuário não tem permissão de atualização', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).abilityService.createForUser({
      id: 'usuario-nao-identificado',
      role: UserRoleEnum.NAO_IDENTIFICADO,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    await expect(service.update(1, {})).rejects.toThrow(
      'Você não tem permissão para update pessoa',
    );
    expect(prismaMock.pessoa.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('findAll nao busca contatos e omite o campo contatos na listagem', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).abilityService.createForUser({
      id: 1,
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    saoPedroPessoaServiceMock.findAllPessoas.mockResolvedValue([externalPessoa]);
    prismaMock.pessoa.findMany.mockResolvedValue([pessoaLocal]);

    const result = await service.findAll(1, 1);

    expect(
      saoPedroContatoServiceMock.findExternalContatos,
    ).toHaveBeenCalledTimes(0);
    expect(result).toHaveLength(1);
    expect(result[0].contatos).toBeUndefined();
  });
});