import { Test, TestingModule } from '@nestjs/testing';
import { EtapaComunidadeService } from './etapa-comunidade.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
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
});
