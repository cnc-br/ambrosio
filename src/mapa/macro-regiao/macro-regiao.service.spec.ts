import { Test, TestingModule } from '@nestjs/testing';
import { MacroRegiaoService } from './macro-regiao.service.js';
import { PrismaService } from 'src/prisma.service.js';

describe('MacroRegiaoService', () => {
  let service: MacroRegiaoService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MacroRegiaoService, PrismaService],
    }).compile();

    service = module.get<MacroRegiaoService>(MacroRegiaoService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  it('should return all macro-regioes', async () => {
    const macroRegioes = [
      {
        id: 1,
        descricao: 'Macro Região 1',
        ativo: true,
        cadastradoPorId: null,
        atualizadoPorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        descricao: 'Macro Região 2',
        ativo: false,
        cadastradoPorId: null,
        atualizadoPorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.spyOn(prisma.macroRegiao, 'findMany').mockResolvedValue(macroRegioes);

    expect(await service.findAll()).toEqual(macroRegioes);
  });

  it('should return a macro-regiao by id', async () => {
    const macroRegiao = {
      id: 1,
      descricao: 'Macro Região 1',
      ativo: true,
      cadastradoPorId: null,
      atualizadoPorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.spyOn(prisma.macroRegiao, 'findUniqueOrThrow').mockResolvedValue(macroRegiao);

    expect(await service.findOne(1)).toEqual(macroRegiao);
  });

  it('should return undefined for a non-existing macro-regiao', async () => {
    vi.spyOn(prisma.macroRegiao, 'findUniqueOrThrow').mockResolvedValue(null);

    expect(await service.findOne(999)).toBeNull();
  });
});
