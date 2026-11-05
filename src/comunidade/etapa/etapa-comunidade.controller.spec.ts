import { Test, TestingModule } from '@nestjs/testing';
import { EtapaComunidadeController } from './etapa-comunidade.controller.js';
import { EtapaComunidadeService } from './etapa-comunidade.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { ComunidadeService } from '../comunidade.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { HistoricoService } from '../historico/historico.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';

describe('EtapaController', () => {
  let controller: EtapaComunidadeController;
  let prismaService: PrismaService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [EtapaComunidadeController],
      providers: [
        EtapaComunidadeService,
        CaslAbilityService,
        PrismaService,
        JwtService,
        ComunidadeService,
        ParoquiaService,
        HistoricoService,
        DioceseService,
        EnderecoService,
        SetorService,
        TipoDioceseService,
        CidadeService,
        EstadoService,
        PaisService,
        {
          provide: SaoPedroPessoaService,
          useValue: { findExternalPessoaByUuid: vi.fn() },
        },
      ],
    }).compile();

    controller = await module.resolve<EtapaComunidadeController>(EtapaComunidadeController);
    prismaService = module.get<PrismaService>(PrismaService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(prismaService).toBeDefined();
  });
});
