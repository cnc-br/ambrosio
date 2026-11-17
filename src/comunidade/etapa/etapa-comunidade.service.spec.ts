import { Test, TestingModule } from '@nestjs/testing';
import { EtapaComunidadeService } from './etapa-comunidade.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { UserRoleEnum } from 'neocatecumenal';
import { PrismaService } from 'src/prisma.service.js';
import { ComunidadeService } from '../comunidade.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { HistoricoService } from '../historico/historico.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';

describe('EtapaService', () => {
  let service: EtapaComunidadeService;
  let prismaService: PrismaService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        EtapaComunidadeService,
        CaslAbilityService,
        PrismaService,
        ComunidadeService,
        EnderecoService,
        ParoquiaService,
        EstadoService,
        CidadeService,
        SetorService,
        HistoricoService,
        DioceseService,
        PaisService,
        TipoDioceseService,
        {
          provide: SaoPedroPessoaService,
          useValue: { findExternalPessoaByUuid: vi.fn() },
        },
      ],
    }).compile();

    service = await module.resolve<EtapaComunidadeService>(EtapaComunidadeService);
    prismaService = module.get<PrismaService>(PrismaService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  describe('auditoria de usuário', () => {
    const criarService = (
      prismaMock: unknown,
      comunidadeServiceMock: unknown,
    ) => {
      const caslAbilityService = new CaslAbilityService();
      caslAbilityService.createForUser({
        id: 'usuario-autor',
        role: UserRoleEnum.ADMIN,
      } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
      return new EtapaComunidadeService(
        prismaMock as never,
        comunidadeServiceMock as never,
        caslAbilityService,
      );
    };

    it('create grava a autoria em comunidadeEtapa e repassa o usuário à comunidade', async () => {
      const create = vi.fn().mockResolvedValue({
        id: 1,
        comunidadeId: 4,
        etapaId: 2,
      });
      const comunidadeUpdate = vi.fn().mockResolvedValue({ id: 4 });
      const modulo = criarService(
        { comunidadeEtapa: { create } },
        { update: comunidadeUpdate },
      );

      await modulo.create(4, { etapaId: 2 } as never, 'usuario-autor');

      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          comunidadeId: 4,
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        }),
      });
      expect(comunidadeUpdate).toHaveBeenCalledWith(
        4,
        { etapaAtualId: 2 },
        'usuario-autor',
      );
    });

    it('update grava atualizadoPorId em comunidadeEtapa', async () => {
      const update = vi.fn().mockResolvedValue({ id: 1 });
      const modulo = criarService(
        { comunidadeEtapa: { update } },
        {} as never,
      );

      await modulo.update(1, { observacao: 'ok' } as never, 'usuario-editor');

      expect(update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ atualizadoPorId: 'usuario-editor' }),
      });
    });
  });
});
