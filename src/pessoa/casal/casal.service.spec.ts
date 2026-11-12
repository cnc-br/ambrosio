import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import { CasalService } from './casal.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { PessoaService } from '../pessoa.service.js';

describe('CasalService', () => {
  let service: CasalService;
  let prismaService: PrismaService;
  let saoPedroPessoaService: SaoPedroPessoaService;
  let comunidadeService: ComunidadeService;
  let abilityService: CaslAbilityService;

  const prismaMock = {
    pessoa: {
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
    },
    pessoaCasal: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };
  const pessoaServiceMock = {
    validarPessoaDentroDoEscopoDeAtualizacao: vi.fn(),
  };
  const saoPedroPessoaServiceMock = {
    findExternalPessoaByUuid: vi.fn(),
    getExternalPessoasEstadoCivilCasado: vi.fn(),
  };
  const comunidadeServiceMock = {
    findByPessoaId: vi.fn(),
    adicionarPessoa: vi.fn(),
  };

  const pessoa = { id: 1, externalId: 'uuid-pessoa' };
  const conjugue = { id: 2, externalId: 'uuid-conjugue' };
  const externalPessoa = {
    sexo: 'M',
    estadoCivil: 'C',
  };
  const externalConjugue = {
    sexo: 'F',
    estadoCivil: 'C',
  };
  const casalCriado = {
    id: 10,
    pessoaMaridoId: 1,
    pessoaMulherId: 2,
  };

  const setAbility = (role: UserRoleEnum, id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).abilityService.createForUser({
      id,
      role,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
  };

  const prepararCasal = () => {
    prismaMock.pessoa.findUniqueOrThrow
      .mockResolvedValueOnce(pessoa)
      .mockResolvedValueOnce(conjugue);
    saoPedroPessoaServiceMock.findExternalPessoaByUuid
      .mockResolvedValueOnce(externalPessoa)
      .mockResolvedValueOnce(externalConjugue);
    prismaMock.pessoaCasal.findFirst.mockResolvedValue(null);
    prismaMock.pessoaCasal.create.mockResolvedValue(casalCriado);
    comunidadeServiceMock.findByPessoaId.mockResolvedValue(null);
    comunidadeServiceMock.adicionarPessoa.mockResolvedValue(undefined);
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasalService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PessoaService, useValue: pessoaServiceMock },
        { provide: SaoPedroPessoaService, useValue: saoPedroPessoaServiceMock },
        { provide: ComunidadeService, useValue: comunidadeServiceMock },
        CaslAbilityService,
      ],
    }).compile();

    service = await module.resolve<CasalService>(CasalService);
    prismaService = module.get<PrismaService>(PrismaService);
    saoPedroPessoaService = module.get<SaoPedroPessoaService>(
      SaoPedroPessoaService,
    );
    comunidadeService = module.get<ComunidadeService>(ComunidadeService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(saoPedroPessoaService).toBeDefined();
    expect(comunidadeService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  describe('createCasal', () => {
    const createCasalDto = { pessoaId: 1, conjugueId: 2 };

    it('SECRETARIA_CNC cria casal com as duas pessoas no escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue(
        pessoa,
      );
      prepararCasal();

      const result = await service.createCasal(createCasalDto);

      expect(result).toEqual(casalCriado);
      expect(
        pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
      ).toHaveBeenCalledTimes(2);
      expect(
        pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
      ).toHaveBeenCalledWith(1);
      expect(
        pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
      ).toHaveBeenCalledWith(2);
      expect(prismaMock.pessoaCasal.create).toHaveBeenCalled();
    });

    it('SECRETARIA_CNC cria casal com uma pessoa fora do escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockImplementation(
        (id: number) =>
          id === 1
            ? Promise.resolve(pessoa)
            : Promise.reject(new ForbiddenException('Fora do escopo')),
      );
      prepararCasal();

      await expect(service.createCasal(createCasalDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.pessoaCasal.create).not.toHaveBeenCalled();
      expect(prismaMock.pessoa.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('SECRETARIA_CNC cria casal com as duas pessoas fora do escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
        new ForbiddenException('Fora do escopo'),
      );
      prepararCasal();

      await expect(service.createCasal(createCasalDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaMock.pessoaCasal.create).not.toHaveBeenCalled();
      expect(prismaMock.pessoa.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('SECRETARIA_CNC cria casal com uma pessoa sem vínculo ativo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue(
        pessoa,
      );
      prepararCasal();

      const result = await service.createCasal(createCasalDto);

      expect(result).toEqual(casalCriado);
    });

    it('ADMIN cria casal sem restrição de escopo', async () => {
      setAbility(UserRoleEnum.ADMIN, 'usuario-admin');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue(
        pessoa,
      );
      prepararCasal();

      const result = await service.createCasal(createCasalDto);

      expect(result).toEqual(casalCriado);
    });

    it('pessoa inexistente no casal propaga 404', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      const notFoundError = Object.assign(
        new Error("O registro de 'Pessoa' não foi encontrado."),
        { code: 'P2025' },
      );
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
        notFoundError,
      );
      prepararCasal();

      await expect(service.createCasal(createCasalDto)).rejects.toBe(
        notFoundError,
      );
      expect(prismaMock.pessoaCasal.create).not.toHaveBeenCalled();
    });

    it('perfil sem permissão de criação de casal é rejeitado', async () => {
      setAbility(UserRoleEnum.NAO_IDENTIFICADO, 'usuario-nao-identificado');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue(
        pessoa,
      );
      prepararCasal();

      await expect(service.createCasal(createCasalDto)).rejects.toThrow(
        'Você não tem permissão para create pessoa',
      );
      expect(
        pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
      ).not.toHaveBeenCalled();
      expect(prismaMock.pessoaCasal.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllBySexoEstadoCivilCasado', () => {
    const externalPessoas = [
      {
        externalId: 'uuid-pessoa',
        nome: 'Pessoa',
        estadoCivil: 'CASADO',
        sexo: 'M',
      },
    ];

    beforeEach(() => {
      saoPedroPessoaServiceMock.getExternalPessoasEstadoCivilCasado.mockResolvedValue(
        externalPessoas,
      );
      prismaMock.pessoa.findMany.mockResolvedValue([]);
    });

    it('SECRETARIA_CNC filtra cônjuges pelas paróquias do usuário', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-secretaria');
      const pessoaElegivel = {
        id: 1,
        externalId: 'uuid-pessoa',
      };
      prismaMock.pessoa.findMany.mockResolvedValue([pessoaElegivel]);

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      expect(prismaMock.pessoa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                comunidadePessoas: {
                  some: {
                    dataSaida: null,
                    comunidade: {
                      is: {
                        paroquia: {
                          is: {
                            usuarioParoquias: {
                              some: { userId: 'usuario-secretaria' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            ]),
          }),
        }),
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          id: 1,
          externalId: 'uuid-pessoa',
        }),
      );
    });

    it('SECRETARIA_CNC sem paróquias retorna lista vazia', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-sem-paroquia');

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      expect(prismaMock.pessoa.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                comunidadePessoas: expect.objectContaining({
                  some: expect.objectContaining({
                    dataSaida: null,
                    comunidade: expect.objectContaining({
                      is: expect.objectContaining({
                        paroquia: expect.objectContaining({
                          is: expect.objectContaining({
                            usuarioParoquias: expect.objectContaining({
                              some: { userId: 'usuario-sem-paroquia' },
                            }),
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            ]),
          }),
        }),
      );
      expect(result).toEqual([]);
    });

    it('ADMIN lista todos os cônjuges sem filtro de paróquia', async () => {
      setAbility(UserRoleEnum.ADMIN, 'usuario-admin');

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      const where = prismaMock.pessoa.findMany.mock.calls[0][0].where;
      expect(where.AND[2]).toEqual({});
      expect(result).toEqual([]);
    });

    it('perfil sem permissão de leitura é rejeitado', async () => {
      setAbility(UserRoleEnum.NAO_IDENTIFICADO, 'usuario-nao-identificado');

      await expect(
        service.findAllBySexoEstadoCivilCasado('M'),
      ).rejects.toThrow('Você não tem permissão para read pessoa');
      expect(
        saoPedroPessoaServiceMock.getExternalPessoasEstadoCivilCasado,
      ).not.toHaveBeenCalled();
    });
  });
});
