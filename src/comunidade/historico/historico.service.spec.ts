import { Test, TestingModule } from '@nestjs/testing';
import { HistoricoService } from './historico.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { UserRoleEnum } from 'neocatecumenal';

describe('HistoricoService', () => {
  let service: HistoricoService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoricoService, PrismaService, CaslAbilityService],
    }).compile();

    service = await module.resolve<HistoricoService>(HistoricoService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  it('grava a autoria quando recebe o usuário', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const prismaMock = { comunidadeHistorico: { create } } as never;
    const caslAbilityService = new CaslAbilityService();
    caslAbilityService.createForUser({
      id: 'usuario-autor',
      role: UserRoleEnum.ADMIN,
    } as unknown as Parameters<CaslAbilityService['createForUser']>[0]);
    const modulo = new HistoricoService(prismaMock, caslAbilityService);

    await modulo.create(
      { comunidadeId: 1, numeroComunidade: 10 } as never,
      'usuario-autor',
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        comunidadeId: 1,
        cadastradoPorId: 'usuario-autor',
        atualizadoPorId: 'usuario-autor',
      }),
    });
  });
});
