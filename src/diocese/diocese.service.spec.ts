import { Test, TestingModule } from '@nestjs/testing';
import { DioceseService } from './diocese.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { LocalidadeService } from 'src/localidade/localidade.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { TipoLocalidadeService } from 'src/configuracoes/tipo-localidade/tipo-localidade.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { HttpModule } from '@nestjs/axios';

describe('DioceseService', () => {
  let service: DioceseService;
  let prismaService: PrismaService;
  let localidadeService: LocalidadeService;
  let tipoLocalidadeService: TipoLocalidadeService;
  let tipoDioceseService: TipoDioceseService;
  let enderecoService: EnderecoService;
  let paisService: PaisService;
  let estadoService: EstadoService;
  let cidadeService: CidadeService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        DioceseService,
        LocalidadeService,
        TipoLocalidadeService,
        TipoDioceseService,
        EnderecoService,
        PaisService,
        EstadoService,
        CidadeService,
        CaslAbilityService,
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            findFirstOrThrow: vi.fn(),
          },
        }
      ],
    }).compile();

    service = await module.resolve<DioceseService>(DioceseService);
    prismaService = module.get<PrismaService>(PrismaService);
    localidadeService = module.get<LocalidadeService>(LocalidadeService);
    tipoLocalidadeService = module.get<TipoLocalidadeService>(
      TipoLocalidadeService,
    );
    tipoDioceseService = module.get<TipoDioceseService>(TipoDioceseService);
    paisService = module.get<PaisService>(PaisService);
    estadoService = module.get<EstadoService>(EstadoService);
    cidadeService = module.get<CidadeService>(CidadeService);
    enderecoService = module.get<EnderecoService>(EnderecoService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(localidadeService).toBeDefined();
    expect(tipoLocalidadeService).toBeDefined();
    expect(paisService).toBeDefined();
    expect(estadoService).toBeDefined();
    expect(cidadeService).toBeDefined();
    expect(tipoDioceseService).toBeDefined();
    expect(enderecoService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  it('create grava a autoria e repassa o usuário ao endereço', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = service as any;
    vi.spyOn(svc, 'validateCreateAbility').mockImplementation(() => {});
    vi.spyOn(tipoDioceseService, 'findOne').mockResolvedValue({
      id: 1,
    } as never);
    const enderecoCreate = vi
      .spyOn(enderecoService, 'create')
      .mockResolvedValue({ id: 9 } as never);
    vi.spyOn(svc, 'serializeResponse').mockReturnValue({} as never);

    const dioceseCreate = vi.fn().mockResolvedValue({ id: 1 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prismaService as any).$transaction = vi.fn((callback: any) =>
      callback({ diocese: { create: dioceseCreate } }),
    );

    await service.create(
      {
        descricao: 'Diocese Nova',
        tipoDiocese: { id: 1 },
        endereco: { cep: '13208200' },
      } as never,
      'usuario-autor',
    );

    expect(enderecoCreate).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'usuario-autor',
    );
    expect(dioceseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cadastradoPorId: 'usuario-autor',
        atualizadoPorId: 'usuario-autor',
      }),
      select: expect.anything(),
    });
  });
});
