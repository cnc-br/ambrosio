import { Test, TestingModule } from '@nestjs/testing';
import { EnderecoService } from './endereco.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { HttpModule } from '@nestjs/axios';

describe('EnderecoService', () => {
  let service: EnderecoService;
  let prismaService: PrismaService;
  let paisService: PaisService;
  let estadoService: EstadoService;
  let cidadeService: CidadeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        EnderecoService,
        PaisService,
        EstadoService,
        CidadeService,
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            findFirstOrThrow: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EnderecoService>(EnderecoService);
    prismaService = module.get<PrismaService>(PrismaService);
    paisService = module.get<PaisService>(PaisService);
    estadoService = module.get<EstadoService>(EstadoService);
    cidadeService = module.get<CidadeService>(CidadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(paisService).toBeDefined();
    expect(estadoService).toBeDefined();
    expect(cidadeService).toBeDefined();
  });

  describe('auditoria de usuário', () => {
    const enderecoDto = {
      cep: '13208200',
      logradouro: 'Rua Tiradentes',
      numero: '4848',
      bairro: 'Centro',
      cidade: 'Judiaí',
      UF: 'SP',
    };

    const criarServico = (prismaMock: unknown) => {
      const paisMock = {
        create: vi.fn().mockResolvedValue({ id: 1, nome: 'Brasil' }),
      };
      const estadoMock = {
        createOrSelect: vi.fn().mockResolvedValue({ id: 1, sigla: 'SP' }),
      };
      const cidadeMock = {
        createOrSelect: vi.fn().mockResolvedValue({ id: 1, nome: 'Judiaí' }),
      };
      const modulo = new EnderecoService(
        prismaMock as never,
        cidadeMock as never,
        estadoMock as never,
        paisMock as never,
      );
      return { modulo, paisMock, estadoMock, cidadeMock };
    };

    it('create grava a autoria e propaga o usuário para país, estado e cidade', async () => {
      const enderecoCreate = vi.fn().mockResolvedValue({ id: 9 });
      const prismaMock = { endereco: { create: enderecoCreate } };
      const { modulo, paisMock, estadoMock, cidadeMock } =
        criarServico(prismaMock);

      await modulo.create(enderecoDto as never, undefined, 'usuario-autor');

      expect(paisMock.create).toHaveBeenCalledWith(
        { nome: 'Brasil' },
        'usuario-autor',
      );
      expect(estadoMock.createOrSelect).toHaveBeenCalledWith(
        expect.anything(),
        'usuario-autor',
      );
      expect(cidadeMock.createOrSelect).toHaveBeenCalledWith(
        expect.anything(),
        'usuario-autor',
      );
      expect(enderecoCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        }),
      });
    });

    it('create sem usuário grava auditoria nula', async () => {
      const enderecoCreate = vi.fn().mockResolvedValue({ id: 9 });
      const prismaMock = { endereco: { create: enderecoCreate } };
      const { modulo, paisMock } = criarServico(prismaMock);

      await modulo.create(enderecoDto as never);

      expect(paisMock.create).toHaveBeenCalledWith({ nome: 'Brasil' }, undefined);
      expect(enderecoCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: null,
          atualizadoPorId: null,
        }),
      });
    });

    it('createByPessoaId grava a autoria no vínculo pessoaEndereco', async () => {
      const pessoaEnderecoCreate = vi.fn().mockResolvedValue({ id: 1 });
      const prismaMock = {
        pessoa: {
          findFirstOrThrow: vi.fn().mockResolvedValue({ id: 5, externalId: 'uuid' }),
        },
        pessoaEndereco: { create: pessoaEnderecoCreate },
      };
      const { modulo } = criarServico(prismaMock);
      vi.spyOn(modulo, 'create').mockResolvedValue({ id: 9 } as never);

      await modulo.createByPessoaId(enderecoDto as never, 5, 'usuario-autor');

      expect(modulo.create).toHaveBeenCalledWith(
        expect.anything(),
        undefined,
        'usuario-autor',
      );
      expect(pessoaEnderecoCreate).toHaveBeenCalledWith({
        data: {
          pessoaId: 5,
          enderecoId: 9,
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        },
      });
    });
  });
});
