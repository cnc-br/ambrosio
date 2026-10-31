import { Test, TestingModule } from '@nestjs/testing';
import { ParoquiaService } from './paroquia.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { HttpModule } from '@nestjs/axios';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { UpdateParoquiaDto } from './dto/update-paroquia.dto.js';
import { UserRoleEnum } from 'neocatecumenal';

describe('ParoquiaService', () => {
  let service: ParoquiaService;
  let prismaService: PrismaService;
  let enderecoService: EnderecoService;
  let dioceseService: DioceseService;
  let tipoDioceseService: TipoDioceseService;
  let cidadeService: CidadeService;
  let estadoService: EstadoService;
  let setorService: SetorService;
  let paisService: PaisService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        ParoquiaService,
        DioceseService,
        EnderecoService,
        TipoDioceseService,
        PaisService,
        EstadoService,
        CidadeService,
        SetorService,
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

    service = await module.resolve<ParoquiaService>(ParoquiaService);
    enderecoService = module.get<EnderecoService>(EnderecoService);
    tipoDioceseService = module.get<TipoDioceseService>(TipoDioceseService);
    dioceseService = await module.resolve<DioceseService>(DioceseService);
    cidadeService = module.get<CidadeService>(CidadeService);
    estadoService = module.get<EstadoService>(EstadoService);
    paisService = module.get<PaisService>(PaisService);
    setorService = module.get<SetorService>(SetorService);
    prismaService = module.get<PrismaService>(PrismaService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(enderecoService).toBeDefined();
    expect(dioceseService).toBeDefined();
    expect(cidadeService).toBeDefined();
    expect(estadoService).toBeDefined();
    expect(setorService).toBeDefined();
    expect(paisService).toBeDefined();
    expect(tipoDioceseService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  // Fixtures no formato esperado por serializeParoquia (PAROQUIA_SELECT)
  const enderecoRaw = {
    id: 9,
    cep: '13208200',
    logradouro: 'Praça Governador Pedro de Toledo',
    numero: 's/n',
    bairro: 'Centro',
    complemento: null,
    observacao: null,
    cidade: {
      id: 1,
      nome: 'Judiaí',
      estado: {
        id: 1,
        sigla: 'SP',
        nome: 'São Paulo',
        pais: { id: 1, nome: 'Brasil' },
      },
    },
  };

  const setorRaw = (id: number) => ({
    id,
    descricao: `Setor ${id}`,
    ativo: true,
    regiao: null,
  });

  const dioceseRaw = {
    id: 1,
    descricao: 'Diocese de Jundiaí',
    endereco: enderecoRaw,
    tipoDiocese: { id: 1, descricao: 'Arquidiocese' },
  };

  const paroquiaRaw = (setorId: number) => ({
    id: 1,
    descricao: 'Paróquia Teste',
    endereco: enderecoRaw,
    setor: setorRaw(setorId),
    diocese: dioceseRaw,
    comunidades: [],
  });

  describe('update', () => {
    let paroquiaUpdateMock: ReturnType<typeof vi.fn>;

    const dtoBase = {
      descricao: 'Nossa Senhora das Dores',
      diocese: { id: 1 },
      endereco: {
        id: 9,
        cep: '13208200',
        logradouro: 'Rua Tiradentes',
        numero: '4848',
        bairro: 'Centro',
        cidade: 'Judiaí',
        UF: 'SP',
      },
    } as UpdateParoquiaDto;

    beforeEach(() => {
      // ADMIN para as validações CASL (mesmo padrão dos specs do repo)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).abilityService.createForUser({
        id: 1,
        role: UserRoleEnum.ADMIN,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Neutraliza as validações de permissão para focar na lógica de dados
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(service as any, 'validateUpdateAbility').mockImplementation(
        () => {},
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(service as any, 'validateReadAbility').mockImplementation(
        () => {},
      );

      // Estende o mock do PrismaService para o caminho de update:
      // findOne interno + $transaction com client fake que grava o data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prismaService as any).paroquia = {
        findFirstOrThrow: vi.fn().mockResolvedValue(paroquiaRaw(1)),
      };

      paroquiaUpdateMock = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prismaService as any).$transaction = vi.fn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callback: any) =>
          callback({ paroquia: { update: paroquiaUpdateMock } }),
      );

      // Colaboradores reais não rodam de verdade no teste unitário.
      // Sempre via (service as any): resolve/geram instâncias diferentes do
      // serviço injetado em ParoquiaService por causa da cadeia REQUEST-scoped.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((service as any).dioceseService, 'findOne').mockResolvedValue({
        id: 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((service as any).enderecoService, 'update').mockResolvedValue({
        id: 9,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    });

    it('atualiza o setorId com o setor informado no DTO', async () => {
      paroquiaUpdateMock.mockResolvedValue(paroquiaRaw(2));

      const result = await service.update(1, {
        ...dtoBase,
        setor: { id: 2 },
      } as UpdateParoquiaDto);

      expect(paroquiaUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ setorId: 2 }),
        }),
      );
      expect(result.setor.id).toBe(2);
    });

    it('mantém o setor atual quando o DTO não informa setor', async () => {
      paroquiaUpdateMock.mockResolvedValue(paroquiaRaw(1));

      const result = await service.update(1, dtoBase);

      const [callArgs] = paroquiaUpdateMock.mock.calls[0];
      expect(callArgs.data).not.toHaveProperty('setorId');
      expect(callArgs.data).toEqual(
        expect.objectContaining({
          descricao: dtoBase.descricao,
          enderecoId: 9,
          dioceseId: 1,
        }),
      );
      expect(result.setor.id).toBe(1);
    });
  });
});
