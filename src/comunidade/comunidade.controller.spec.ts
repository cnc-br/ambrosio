import { Test, TestingModule } from '@nestjs/testing';
import { ComunidadeController } from './comunidade.controller.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { EtapaComunidadeService } from './etapa/etapa-comunidade.service.js';
import { HistoricoService } from './historico/historico.service.js';
import { ComunidadeService } from './comunidade.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';

describe('ComunidadeController', () => {
  let controller: ComunidadeController;
  let prismaService: PrismaService;
  let enderecoService: EnderecoService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComunidadeController],
      imports: [HttpModule],
      providers: [
        ComunidadeService,
        PrismaService,
        CaslAbilityService,
        ParoquiaService,
        SetorService,
        EtapaComunidadeService,
        DioceseService,
        EnderecoService,
        TipoDioceseService,
        CidadeService,
        HistoricoService,
        EstadoService,
        PaisService,
        JwtService,
        {
          provide: SaoPedroPessoaService,
          useValue: { findExternalPessoaByUuid: vi.fn() },
        },
      ],
    }).compile();

    controller =
      await module.resolve<ComunidadeController>(ComunidadeController);
    prismaService = module.get<PrismaService>(PrismaService);
    enderecoService = module.get<EnderecoService>(EnderecoService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(enderecoService).toBeDefined();
  });
});
