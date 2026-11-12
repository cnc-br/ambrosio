import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { PessoaService } from './pessoa.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

describe('PessoaService', () => {
  let service: PessoaService;
  let prismaService: PrismaService;
  let situacaoReligiosaService: SituacaoReligiosaService;
  let saoPedroPessoaService: SaoPedroPessoaService;
  let saoPedroContatoService: SaoPedroContatoService;
  let comunidadeService: ComunidadeService;
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
  const comunidadeServiceMock = {
    validarComunidadeDentroDoEscopoDeAtualizacao: vi.fn(),
    adicionarPessoa: vi.fn(),
  };
  const prismaMock = {
    create: vi.fn(),
    findFirstOrThrow: vi.fn(),
    pessoa: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    pessoaCasal: {
      findFirst: vi.fn(),
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
        {
          provide: ComunidadeService,
          useValue: comunidadeServiceMock,
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
    comunidadeService = module.get<ComunidadeService>(ComunidadeService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(situacaoReligiosaService).toBeDefined();
    expect(comunidadeService).toBeDefined();
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

    await expect(service.update(1, {}, autorId)).rejects.toThrow(
      'Você não tem permissão para update pessoa',
    );
    expect(prismaMock.pessoa.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  const setAdminAbility = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).abilityService.createForUser({
      id: 1,
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
    prismaMock.pessoa.findFirst.mockResolvedValue(pessoaLocal);
  };

  const setSecretariaAbility = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).abilityService.createForUser({
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
    prismaMock.pessoa.findFirst.mockResolvedValue(pessoaLocal);
  };

  it('update não valida CPF quando o CPF não é informado', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(saoPedroPessoaServiceMock.getExternalPessoaByCpf).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('update não valida CPF quando o CPF informado é igual ao atual', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);

    await service.update(1, { cpf: '12345678901' }, autorId);

    expect(saoPedroPessoaServiceMock.getExternalPessoaByCpf).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('update aceita um CPF novo válido e não registrado', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.getExternalPessoaByCpf.mockResolvedValue(null);

    await service.update(1, { cpf: '52998224725' }, autorId);

    expect(
      saoPedroPessoaServiceMock.getExternalPessoaByCpf,
    ).toHaveBeenCalledWith('52998224725');
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('update rejeita CPF novo inválido', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);

    await expect(
      service.update(1, { cpf: '52998224724' }, autorId),
    ).rejects.toThrow(
      BadRequestException,
    );
    expect(saoPedroPessoaServiceMock.getExternalPessoaByCpf).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).not.toHaveBeenCalled();
  });

  it('update rejeita CPF novo já cadastrado no sistema', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.getExternalPessoaByCpf.mockResolvedValue(
      externalPessoa,
    );
    prismaMock.pessoa.findUnique.mockResolvedValue(pessoaLocal);

    await expect(
      service.update(1, { cpf: '52998224725' }, autorId),
    ).rejects.toThrow(
      ConflictException,
    );
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).not.toHaveBeenCalled();
  });

  it('update grava o usuário autenticado em atualizadoPorId após sucesso', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(prismaMock.pessoa.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { atualizadoPorId: autorId },
    });
  });

  it('update não grava autoria quando a atualização externa falha', async () => {
    setAdminAbility();
    vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockRejectedValue(
      new Error('falha externa'),
    );

    await expect(
      service.update(1, { nome: 'Novo Nome' }, autorId),
    ).rejects.toThrow('falha externa');

    expect(prismaMock.pessoa.update).not.toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza pessoa com vínculo ativo na paróquia do usuário', async () => {
    setSecretariaAbility();
    const findOne = vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(findOne).toHaveBeenCalledWith(1);
    expect(prismaMock.pessoa.findFirst).toHaveBeenCalledWith({
      where: { AND: [{ id: 1 }, expect.any(Object)] },
    });
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza pessoa sem vínculo ativo com comunidade', async () => {
    setSecretariaAbility();
    const findOne = vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(findOne).toHaveBeenCalledWith(1);
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza pessoa com vínculo apenas encerrado', async () => {
    setSecretariaAbility();
    const findOne = vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(findOne).toHaveBeenCalledWith(1);
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza pessoa com vínculos ativos em paróquias próprias e de terceiros', async () => {
    setSecretariaAbility();
    const findOne = vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(findOne).toHaveBeenCalledWith(1);
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('SECRETARIA_CNC não atualiza pessoa com vínculo ativo em outra paróquia', async () => {
    setSecretariaAbility();
    prismaMock.pessoa.findFirst.mockResolvedValue(null);
    prismaMock.pessoa.findUniqueOrThrow.mockResolvedValue(pessoaLocal);
    const findOne = vi.spyOn(service, 'findOne');

    await expect(
      service.update(1, { nome: 'Novo Nome' }, autorId),
    ).rejects.toThrow(ForbiddenException);

    expect(findOne).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).not.toHaveBeenCalled();
    expect(prismaMock.pessoa.update).not.toHaveBeenCalled();
  });

  it('update de pessoa inexistente propaga 404', async () => {
    setSecretariaAbility();
    prismaMock.pessoa.findFirst.mockResolvedValue(null);
    const notFoundError = Object.assign(
      new Error('O registro de Pessoa não foi encontrado.'),
      { code: 'P2025' },
    );
    prismaMock.pessoa.findUniqueOrThrow.mockRejectedValue(notFoundError);
    const findOne = vi.spyOn(service, 'findOne');

    await expect(
      service.update(1, { nome: 'Novo Nome' }, autorId),
    ).rejects.toBe(notFoundError);

    expect(findOne).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).not.toHaveBeenCalled();
  });

  it('ADMIN atualiza pessoa sem restrição de escopo', async () => {
    setAdminAbility();
    const findOne = vi.spyOn(service, 'findOne').mockResolvedValue({
      id: 1,
      externalId: 'uuid-externo',
      cpf: '12345678901',
    } as unknown as Awaited<ReturnType<PessoaService['findOne']>>);
    saoPedroPessoaServiceMock.updateExternalPessoa.mockResolvedValue({});

    await service.update(1, { nome: 'Novo Nome' }, autorId);

    expect(findOne).toHaveBeenCalledWith(1);
    expect(
      saoPedroPessoaServiceMock.updateExternalPessoa,
    ).toHaveBeenCalled();
  });

  it('create ignora autoria enviada no payload', async () => {
    prepararCriacao();
    const dtoComAutoria = {
      ...createPessoaDto,
      cadastradoPorId: 'usuario-forjado',
      atualizadoPorId: 'usuario-forjado',
    } as unknown as Parameters<PessoaService['create']>[0];

    await service.create(dtoComAutoria, autorId);

    expect(prismaMock.pessoa.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cadastradoPorId: autorId,
          atualizadoPorId: autorId,
        }),
      }),
    );
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

  const createPessoaDto = {
    nome: 'Maria Silva Santos',
    conhecidoPor: 'Maria',
    nacionalidade: 'brasileira',
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
  } as unknown as Parameters<PessoaService['create']>[0];

  const autorId = 'usuario-autor';

  const prepararCriacao = () => {
    setAdminAbility();
    vi.mocked(situacaoReligiosaService.findOne).mockResolvedValue({
      id: 1,
      descricao: 'LEIGO',
    } as never);
    saoPedroPessoaServiceMock.createExternalPessoa.mockResolvedValue(
      externalPessoa,
    );
    prismaMock.pessoa.create.mockResolvedValue(pessoaLocal);
  };

  it('create com comunidadeId valida o escopo ANTES de criar a pessoa em 403/404', async () => {
    prepararCriacao();
    comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao.mockRejectedValue(
      new ForbiddenException('Você não tem permissão'),
    );

    await expect(service.create(createPessoaDto, autorId, 10)).rejects.toThrow(
      ForbiddenException,
    );

    expect(
      comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao,
    ).toHaveBeenCalledWith(10);
    expect(
      saoPedroPessoaServiceMock.createExternalPessoa,
    ).not.toHaveBeenCalled();
    expect(prismaMock.pessoa.create).not.toHaveBeenCalled();
  });

  it('create cria a pessoa e depois vincula à comunidade', async () => {
    prepararCriacao();
    comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao.mockResolvedValue(
      {},
    );
    comunidadeServiceMock.adicionarPessoa.mockResolvedValue({});

    const result = await service.create(createPessoaDto, autorId, 10);

    expect(
      comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao,
    ).toHaveBeenCalledWith(10);
    expect(
      saoPedroPessoaServiceMock.createExternalPessoa,
    ).toHaveBeenCalledWith(createPessoaDto);
    expect(prismaMock.pessoa.create).toHaveBeenCalledWith({
      data: {
        externalId: externalPessoa.externalId,
        situacaoReligiosaId: 1,
        cadastradoPorId: autorId,
        atualizadoPorId: autorId,
      },
    });
    expect(comunidadeServiceMock.adicionarPessoa).toHaveBeenCalledWith(10, 1);
    expect(result.id).toBe(1);
  });

  it('create desfaz o cadastro local da pessoa quando o vínculo falha', async () => {
    prepararCriacao();
    comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao.mockResolvedValue(
      {},
    );
    const erroVinculo = new Error('Falha ao vincular');
    comunidadeServiceMock.adicionarPessoa.mockRejectedValue(erroVinculo);

    await expect(service.create(createPessoaDto, autorId, 10)).rejects.toThrow(
      'Falha ao vincular',
    );

    expect(prismaMock.pessoa.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('create sem comunidadeId não valida vínculo nem adiciona à comunidade', async () => {
    prepararCriacao();

    const result = await service.create(createPessoaDto, autorId);

    expect(
      comunidadeServiceMock.validarComunidadeDentroDoEscopoDeAtualizacao,
    ).not.toHaveBeenCalled();
    expect(comunidadeServiceMock.adicionarPessoa).not.toHaveBeenCalled();
    expect(
      saoPedroPessoaServiceMock.createExternalPessoa,
    ).toHaveBeenCalled();
    expect(result.id).toBe(1);
  });
});