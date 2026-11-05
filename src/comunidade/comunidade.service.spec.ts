import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { PrismaService } from 'src/prisma.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { JwtService } from '@nestjs/jwt';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { HttpModule } from '@nestjs/axios';
import { EtapaComunidadeService } from './etapa/etapa-comunidade.service.js';
import { HistoricoService } from './historico/historico.service.js';
import { ComunidadeService } from './comunidade.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';

describe('ComunidadeService', () => {
  let service: ComunidadeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComunidadeService,
        PrismaService,
        ParoquiaService,
        CaslAbilityService,
        DioceseService,
        EnderecoService,
        CidadeService,
        PaisService,
        EtapaComunidadeService,
        EstadoService,
        SetorService,
        JwtService,
        TipoDioceseService,
        HistoricoService,
        {
          provide: SaoPedroPessoaService,
          useValue: { findExternalPessoaByUuid: vi.fn() },
        },
      ],
      imports: [HttpModule],
    }).compile();

    service = await module.resolve<ComunidadeService>(ComunidadeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('inclui o filtro de escopo de paróquia no where de findAll', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prismaMock = {
      comunidade: { findMany },
    } as unknown as PrismaService;

    const caslAbilityService = new CaslAbilityService();
    caslAbilityService.createForUser({
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    const scopedService = new ComunidadeService(
      prismaMock,
      {} as HistoricoService,
      caslAbilityService,
      {
        findExternalPessoaByUuid: vi.fn(),
      } as unknown as SaoPedroPessoaService,
    );

    await scopedService.findAll(1);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                {
                  paroquia: {
                    is: {
                      usuarioParoquias: {
                        some: { userId: 'usuario-secretaria' },
                      },
                    },
                  },
                },
              ],
            },
            { paroquiaId: 1 },
          ],
        },
      }),
    );
  });

  it('resolve nomes externos e serializa carismas no findOne', async () => {
    const comunidadeMock = {
      id: 1,
      numeroDaComunidade: 1,
      quantidadeMembros: 10,
      observacao: null,
      comunidadeEtapas: [],
      paroquia: {
        id: 1,
        descricao: 'Paróquia',
        diocese: {
          id: 1,
          descricao: 'Diocese',
          tipoDioceseId: 1,
          tipoDiocese: { id: 1, descricao: 'Arquidiocese' },
        },
      },
      comunidadePessoas: [
        {
          pessoa: {
            id: 2,
            externalId: 'uuid-joao',
            pessoaCarismas: [
              {
                carisma: {
                  id: 1,
                  descricao: 'Responsável',
                  tipo: 'VINCULADO',
                  casalAndaJunto: true,
                },
              },
            ],
            casamentosComoMarido: [],
            casamentosComoMulher: [],
          },
        },
      ],
    };

    const findFirstOrThrow = vi.fn().mockResolvedValue(comunidadeMock);
    const prismaMock = {
      comunidade: { findFirstOrThrow },
    } as unknown as PrismaService;

    const caslAbilityService = new CaslAbilityService();
    caslAbilityService.createForUser({
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    const saoPedroMock = {
      findExternalPessoaByUuid: vi.fn().mockResolvedValue({
        id: 2,
        externalId: 'uuid-joao',
        nome: 'João',
      }),
    } as unknown as SaoPedroPessoaService;

    const scopedService = new ComunidadeService(
      prismaMock,
      {} as HistoricoService,
      caslAbilityService,
      saoPedroMock,
    );

    const result = await scopedService.findOne(1);

    expect(findFirstOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          comunidadePessoas: expect.any(Object),
        }),
      }),
    );
    expect(saoPedroMock.findExternalPessoaByUuid).toHaveBeenCalledWith(
      'uuid-joao',
    );
    expect(result.carismas).toHaveLength(1);
    expect(result.carismas[0]).toMatchObject({
      id: 1,
      descricao: 'Responsável',
      tipo: 'VINCULADO',
    });
    expect(result.carismas[0].pessoas[0]).toMatchObject({
      id: 2,
      externalId: 'uuid-joao',
      nome: 'João',
    });
  });

  it('continue serializando quando a resolução externa de nome falha', async () => {
    const comunidadeMock = {
      id: 1,
      numeroDaComunidade: 1,
      quantidadeMembros: 10,
      observacao: null,
      comunidadeEtapas: [],
      paroquia: {
        id: 1,
        descricao: 'Paróquia',
        diocese: {
          id: 1,
          descricao: 'Diocese',
          tipoDioceseId: 1,
          tipoDiocese: { id: 1, descricao: 'Arquidiocese' },
        },
      },
      comunidadePessoas: [
        {
          pessoa: {
            id: 2,
            externalId: 'uuid-joao',
            pessoaCarismas: [
              {
                carisma: {
                  id: 1,
                  descricao: 'Responsável',
                  tipo: 'VINCULADO',
                  casalAndaJunto: true,
                },
              },
            ],
            casamentosComoMarido: [],
            casamentosComoMulher: [],
          },
        },
      ],
    };

    const findFirstOrThrow = vi.fn().mockResolvedValue(comunidadeMock);
    const prismaMock = {
      comunidade: { findFirstOrThrow },
    } as unknown as PrismaService;

    const caslAbilityService = new CaslAbilityService();
    caslAbilityService.createForUser({
      id: 'usuario-admin',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    const saoPedroMock = {
      findExternalPessoaByUuid: vi.fn().mockRejectedValue(new Error('API off')),
    } as unknown as SaoPedroPessoaService;

    const scopedService = new ComunidadeService(
      prismaMock,
      {} as HistoricoService,
      caslAbilityService,
      saoPedroMock,
    );

    const result = await scopedService.findOne(1);

    expect(result.carismas).toHaveLength(1);
    // nome fica vazio quando a resolução externa falha, mas a serialização não quebra
    expect(result.carismas[0].pessoas[0].nome).toBe('');
  });
});
