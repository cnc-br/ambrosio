import { Test, TestingModule } from '@nestjs/testing';
import { PessoaController } from './pessoa.controller.js';
import { PessoaService } from './pessoa.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { EstadoCivilService } from 'src/configuracoes/estado-civil/estado-civil.service.js';
import { EscolaridadeService } from 'src/configuracoes/escolaridade/escolaridade.service.js';
import { JwtService } from '@nestjs/jwt';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { CasalService } from './casal/casal.service.js';
import { ContatoService } from './contato/contato.service.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { HistoricoService } from 'src/comunidade/historico/historico.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { HttpModule } from '@nestjs/axios';

describe('PessoaController', () => {
  let controller: PessoaController;
  let prismaService: PrismaService;
  let estadoCivilService: EstadoCivilService;
  let escolaridadeService: EscolaridadeService;
  let situacaoReligiosaService: SituacaoReligiosaService;
  let saoPedroPessoaService: SaoPedroPessoaService;
  let jwtService: JwtService;
  let abilityService: CaslAbilityService;

  const contatoServiceMock = { create: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      controllers: [PessoaController],
      providers: [
        PessoaService,
        CasalService,
        JwtService,
        ComunidadeService,
        ParoquiaService,
        HistoricoService,
        DioceseService,
        TipoDioceseService,
        EnderecoService,
        EstadoService,
        CidadeService,
        SetorService,
        PaisService,
        CaslAbilityService,
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            findFirstOrThrow: vi.fn(),
          },
        },
        {
          provide: EstadoCivilService,
          useValue: {
            findAll: vi.fn(),
            findOne: vi.fn(),
          },
        },
        {
          provide: EscolaridadeService,
          useValue: {
            findAll: vi.fn(),
            findOne: vi.fn(),
          },
        },
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
          useValue: {
            getPessoas: vi.fn().mockResolvedValue([]),
            postExternalPessoa: vi
              .fn()
              .mockResolvedValue({ id: 1, nome: 'João' }),
          },
        },
        {
          provide: SaoPedroContatoService,
          useValue: {
            createExternalContato: vi.fn(),
            findExternalContatos: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ContatoService,
          useValue: contatoServiceMock,
        },
      ],
    }).compile();

    controller = await module.resolve<PessoaController>(PessoaController);
    prismaService = module.get<PrismaService>(PrismaService);
    saoPedroPessoaService = module.get<SaoPedroPessoaService>(
      SaoPedroPessoaService,
    );
    estadoCivilService = module.get<EstadoCivilService>(EstadoCivilService);
    escolaridadeService = module.get<EscolaridadeService>(EscolaridadeService);
    situacaoReligiosaService = module.get<SituacaoReligiosaService>(
      SituacaoReligiosaService,
    );
    jwtService = module.get<JwtService>(JwtService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(estadoCivilService).toBeDefined();
    expect(escolaridadeService).toBeDefined();
    expect(situacaoReligiosaService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(saoPedroPessoaService).toBeDefined();
  });

  it('deve delegar a criação de contato para o ContatoService', async () => {
    const dto = { email: 'contato@exemplo.com' };
    const contato = {
      id: 1,
      pessoaId: 1,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      contatoPrincipal: true,
    };
    contatoServiceMock.create.mockResolvedValue(contato);

    const result = await controller.createContato('1', dto);

    expect(contatoServiceMock.create).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(contato);
  });
});
