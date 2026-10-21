import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleEnum } from 'neocatecumenal';
import { PrismaService } from 'src/prisma.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { CidadeService } from 'src/configuracoes/cidade/cidade.service.js';
import { PaisService } from 'src/configuracoes/pais/pais.service.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { JwtService } from '@nestjs/jwt';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { EstadoService } from 'src/configuracoes/estado/estado.service.js';
import { HttpModule } from '@nestjs/axios';
import { EtapaComunidadeService } from './etapa/etapa-comunidade.service.js';
import { HistoricoService } from './historico/historico.service.js';
import { ComunidadeService } from './comunidade.service.js';

describe('ComunidadeService', () => {
  let service: ComunidadeService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComunidadeService,
        PrismaService,
        ParoquiaService,
        CaslAbilityService,
        DioceseService,
        EnderecoService,
        CidadeService,
        PaisService,
        EtapaComunidadeService,
        EstadoService,
        SetorService,
        JwtService,
        TipoDioceseService,
        HistoricoService,
      ],
      imports: [HttpModule],
    }).compile();

    service = await module.resolve<ComunidadeService>(ComunidadeService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('inclui o filtro de escopo de paróquia no where de findAll', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const prismaMock = {
      comunidade: { findMany },
    } as unknown as PrismaService;

    const caslAbilityService = new CaslAbilityService();
    caslAbilityService.createForUser({
      id: 'usuario-secretaria',
      role: UserRoleEnum.SECRETARIA_CNC,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);

    const scopedService = new ComunidadeService(
      prismaMock,
      {} as ParoquiaService,
      {} as HistoricoService,
      caslAbilityService,
    );

    await scopedService.findAll(1);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              OR: [
                {
                  paroquia: {
                    is: {
                      usuarioParoquias: {
                        some: { userId: 'usuario-secretaria' },
                      },
                    },
                  },
                },
              ],
            },
            { paroquiaId: 1 },
          ],
        },
      }),
    );
  });
});
