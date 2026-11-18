import { Test, TestingModule } from '@nestjs/testing';
import { EquipeService } from './equipe.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { TipoEquipeService } from 'src/configuracoes/tipo-equipe/tipo-equipe.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { PessoaRepository } from 'src/pessoa/repositories/pessoa.repository.js';
import { PessoaCasalRepository } from 'src/pessoa/repositories/pessoa-casal.repository.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { UserRoleEnum } from 'neocatecumenal';

describe('EquipeService', () => {
  let service: EquipeService;
  let prismaService: PrismaService;
  let abilityService: CaslAbilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipeService,
        PrismaService,
        CaslAbilityService,
        TipoEquipeService,
        PessoaService,
        { provide: PessoaRepository, useValue: {} },
        { provide: PessoaCasalRepository, useValue: {} },
        { provide: ComunidadeService, useValue: {} },
        SaoPedroPessoaService,
        SaoPedroAuthService,
        SaoPedroContatoService,
        SituacaoReligiosaService,
      ],
      imports: [HttpModule],
    }).compile();

    service = await module.resolve<EquipeService>(EquipeService);
    prismaService = module.get<PrismaService>(PrismaService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  describe('auditoria de usuário', () => {
    const criarService = (prismaMock: unknown, pessoaServiceMock: unknown) => {
      const ability = new CaslAbilityService();
      ability.createForUser({
        id: 'usuario-autor',
        role: UserRoleEnum.ADMIN,
      } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
      return new EquipeService(
        prismaMock as never,
        { findOne: vi.fn().mockResolvedValue({ id: 1 }) } as never,
        pessoaServiceMock as never,
        ability,
      );
    };

    it('create grava a autoria na equipe e no vínculo equipePessoa', async () => {
      const equipeCreate = vi
        .fn()
        .mockResolvedValue({ id: 1, descricao: 'Equipe' });
      const upsert = vi.fn().mockResolvedValue({ id: 1 });
      const prismaMock = {
        equipe: {
          create: equipeCreate,
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
        equipePessoa: { upsert },
      };

      const modulo = criarService(prismaMock, {
        findOne: vi.fn().mockResolvedValue({ id: 2 }),
      });

      await modulo.create(
        {
          descricao: 'Equipe',
          tipoEquipeId: 1,
          pessoas: [{ id: 2 }],
        } as never,
        'usuario-autor',
      );

      expect(equipeCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        }),
      });
      expect(upsert).toHaveBeenCalledWith({
        where: { equipeId_pessoaId: { equipeId: 1, pessoaId: 2 } },
        update: expect.objectContaining({ atualizadoPorId: 'usuario-autor' }),
        create: expect.objectContaining({
          cadastradoPorId: 'usuario-autor',
          atualizadoPorId: 'usuario-autor',
        }),
      });
    });

    it('update grava atualizadoPorId na equipe e no vínculo atualizado', async () => {
      const equipeUpdate = vi.fn().mockResolvedValue({ id: 1 });
      const upsert = vi.fn().mockResolvedValue({ id: 1 });
      const prismaMock = {
        equipe: {
          update: equipeUpdate,
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
        equipePessoa: { upsert },
      };

      const modulo = criarService(prismaMock, {
        findOne: vi.fn().mockResolvedValue({ id: 2 }),
      });

      await modulo.update(
        1,
        {
          descricao: 'Equipe editada',
          tipoEquipeId: 1,
          pessoas: [{ id: 2 }],
        } as never,
        'usuario-editor',
      );

      expect(equipeUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ atualizadoPorId: 'usuario-editor' }),
      });
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            atualizadoPorId: 'usuario-editor',
          }),
        }),
      );
    });
  });
});
