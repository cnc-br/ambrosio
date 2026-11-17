import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import { CasalService } from './casal.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { PessoaRepository } from '../repositories/pessoa.repository.js';
import { PessoaCasalRepository } from '../repositories/pessoa-casal.repository.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { PessoaService } from '../pessoa.service.js';

describe('CasalService', () => {
  let service: CasalService;
  let pessoaRepository: PessoaRepository;
  let pessoaCasalRepository: PessoaCasalRepository;
  let saoPedroPessoaService: SaoPedroPessoaService;
  let comunidadeService: ComunidadeService;
  let abilityService: CaslAbilityService;

  const pessoaRepositoryMock = {
    findUniqueOrThrowPorId: vi.fn(),
    findManyElegiveisCasal: vi.fn(),
  };
  const pessoaCasalRepositoryMock = {
    findFirst: vi.fn(),
    create: vi.fn(),
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
    pessoaRepositoryMock.findUniqueOrThrowPorId
      .mockResolvedValueOnce(pessoa)
      .mockResolvedValueOnce(conjugue);
    saoPedroPessoaServiceMock.findExternalPessoaByUuid
      .mockResolvedValueOnce(externalPessoa)
      .mockResolvedValueOnce(externalConjugue);
    pessoaCasalRepositoryMock.findFirst.mockResolvedValue(null);
    pessoaCasalRepositoryMock.create.mockResolvedValue(casalCriado);
    comunidadeServiceMock.findByPessoaId.mockResolvedValue(null);
    comunidadeServiceMock.adicionarPessoa.mockResolvedValue(undefined);
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CasalService,
        { provide: PessoaRepository, useValue: pessoaRepositoryMock },
        {
          provide: PessoaCasalRepository,
          useValue: pessoaCasalRepositoryMock,
        },
        { provide: PessoaService, useValue: pessoaServiceMock },
        { provide: SaoPedroPessoaService, useValue: saoPedroPessoaServiceMock },
        { provide: ComunidadeService, useValue: comunidadeServiceMock },
        CaslAbilityService,
      ],
    }).compile();

    service = await module.resolve<CasalService>(CasalService);
    pessoaRepository = module.get<PessoaRepository>(PessoaRepository);
    pessoaCasalRepository = module.get<PessoaCasalRepository>(
      PessoaCasalRepository,
    );
    saoPedroPessoaService = module.get<SaoPedroPessoaService>(
      SaoPedroPessoaService,
    );
    comunidadeService = module.get<ComunidadeService>(ComunidadeService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(pessoaRepository).toBeDefined();
    expect(pessoaCasalRepository).toBeDefined();
    expect(saoPedroPessoaService).toBeDefined();
    expect(comunidadeService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  describe('createCasal', () => {
    const createCasalDto = { pessoaId: 1, conjugueId: 2 };

    it('SECRETARIA_PAROQUIA cria casal com as duas pessoas no escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
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
      expect(pessoaCasalRepositoryMock.create).toHaveBeenCalled();
    });

    it('SECRETARIA_PAROQUIA cria casal com uma pessoa fora do escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
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
      expect(pessoaCasalRepositoryMock.create).not.toHaveBeenCalled();
      expect(pessoaRepositoryMock.findUniqueOrThrowPorId).not.toHaveBeenCalled();
    });

    it('SECRETARIA_PAROQUIA cria casal com as duas pessoas fora do escopo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
        new ForbiddenException('Fora do escopo'),
      );
      prepararCasal();

      await expect(service.createCasal(createCasalDto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(pessoaCasalRepositoryMock.create).not.toHaveBeenCalled();
      expect(pessoaRepositoryMock.findUniqueOrThrowPorId).not.toHaveBeenCalled();
    });

    it('SECRETARIA_PAROQUIA cria casal com uma pessoa sem vínculo ativo', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
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
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
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
      expect(pessoaCasalRepositoryMock.create).not.toHaveBeenCalled();
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
      expect(pessoaCasalRepositoryMock.create).not.toHaveBeenCalled();
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
      pessoaRepositoryMock.findManyElegiveisCasal.mockResolvedValue([]);
    });

    it('SECRETARIA_PAROQUIA filtra cônjuges pelas paróquias do usuário', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-secretaria');
      const pessoaElegivel = {
        id: 1,
        externalId: 'uuid-pessoa',
      };
      pessoaRepositoryMock.findManyElegiveisCasal.mockResolvedValue([pessoaElegivel]);

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      expect(pessoaRepositoryMock.findManyElegiveisCasal).toHaveBeenCalledWith(
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
                            OR: [
                              {
                                usuarioParoquias: {
                                  some: { userId: 'usuario-secretaria' },
                                },
                              },
                            ],
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

    it('SECRETARIA_PAROQUIA sem paróquias retorna lista vazia', async () => {
      setAbility(UserRoleEnum.SECRETARIA_PAROQUIA, 'usuario-sem-paroquia');

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      expect(pessoaRepositoryMock.findManyElegiveisCasal).toHaveBeenCalledWith(
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
                            OR: expect.arrayContaining([
                              expect.objectContaining({
                                usuarioParoquias: expect.objectContaining({
                                  some: { userId: 'usuario-sem-paroquia' },
                                }),
                              }),
                            ]),
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

    it('SECRETARIA_CNC filtra cônjuges pelos setores do usuário', async () => {
      setAbility(UserRoleEnum.SECRETARIA_CNC, 'usuario-cnc');

      await service.findAllBySexoEstadoCivilCasado('M');

      expect(pessoaRepositoryMock.findManyElegiveisCasal).toHaveBeenCalledWith(
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
                            OR: [
                              {
                                setor: {
                                  is: {
                                    usuarioSetores: {
                                      some: { userId: 'usuario-cnc' },
                                    },
                                  },
                                },
                              },
                            ],
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
    });

    it('ADMIN lista todos os cônjuges sem filtro de paróquia', async () => {
      setAbility(UserRoleEnum.ADMIN, 'usuario-admin');

      const result = await service.findAllBySexoEstadoCivilCasado('M');

      const where = pessoaRepositoryMock.findManyElegiveisCasal.mock.calls[0][0].where;
      expect(where.AND[2]).toEqual({
        comunidadePessoas: {
          some: {
            dataSaida: null,
            comunidade: { is: { paroquia: { is: {} } } },
          },
        },
      });
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
