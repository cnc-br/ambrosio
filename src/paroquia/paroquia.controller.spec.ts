import { Test, TestingModule } from '@nestjs/testing';
import { ParoquiaController } from './paroquia.controller.js';
import { ParoquiaService } from './paroquia.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { HttpModule } from '@nestjs/axios';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { RegiaoService } from 'src/mapa/regiao/regiao.service.js';
import { MacroRegiaoService } from 'src/mapa/macro-regiao/macro-regiao.service.js';

describe('ParoquiaController', () => {
  let controller: ParoquiaController;
  let prismaService: PrismaService;
  let enderecoService: EnderecoService;
  let dioceseService: DioceseService;
  let tipoDioceseService: TipoDioceseService;
  let cidadeService: CidadeService;
  let estadoService: EstadoService;
  let paisService: PaisService;
  let setorService: SetorService;
  let jwtService: JwtService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [ParoquiaController],
      providers: [
        ParoquiaService,
        DioceseService,
        EnderecoService,
        TipoDioceseService,
        CidadeService,
        EstadoService,
        PaisService,
        SetorService,
        RegiaoService,
        MacroRegiaoService,
        JwtService,
        CaslAbilityService,
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            findFirstOrThrow: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = await module.resolve<ParoquiaController>(ParoquiaController);
    prismaService = module.get<PrismaService>(PrismaService);
    enderecoService = module.get<EnderecoService>(EnderecoService);
    tipoDioceseService = module.get<TipoDioceseService>(TipoDioceseService);
    cidadeService = module.get<CidadeService>(CidadeService);
    estadoService = module.get<EstadoService>(EstadoService);
    paisService = module.get<PaisService>(PaisService);
    setorService = await module.resolve<SetorService>(SetorService);
    dioceseService = await module.resolve<DioceseService>(DioceseService);
    jwtService = module.get<JwtService>(JwtService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(dioceseService).toBeDefined();
    expect(enderecoService).toBeDefined();
    expect(tipoDioceseService).toBeDefined();
    expect(setorService).toBeDefined();
    expect(cidadeService).toBeDefined();
    expect(estadoService).toBeDefined();
    expect(paisService).toBeDefined();
  });
});
