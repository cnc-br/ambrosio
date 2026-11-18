import { Test, TestingModule } from '@nestjs/testing';
import { SetorController } from './setor.controller.js';
import { SetorService } from './setor.service.js';
import { PrismaService } from 'src/prisma.service.js';

describe('SetorController', () => {
  let controller: SetorController;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetorController],
      providers: [
        SetorService,
        {
          provide: PrismaService,
          useValue: {
            setor: {
              findMany: vi.fn(),
              findUniqueOrThrow: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<SetorController>(SetorController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prisma).toBeDefined();
  });

  it('should return all setores', async () => {
    const setores = [
      {
        id: 1,
        descricao: 'Setor 1',
        ativo: true,
        regiaoId: 1,
        cadastradoPorId: null,
        atualizadoPorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        descricao: 'Setor 2',
        ativo: false,
        regiaoId: 2,
        cadastradoPorId: null,
        atualizadoPorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.spyOn(prisma.setor, 'findMany').mockResolvedValue(setores);

    expect(await controller.findAll()).toEqual(setores);
  });

  it('should return a setor by id', async () => {
    const setor = {
      id: 1,
      descricao: 'Setor 1',
      ativo: true,
      regiaoId: 1,
      cadastradoPorId: null,
      atualizadoPorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.spyOn(prisma.setor, 'findUniqueOrThrow').mockResolvedValue(setor);

    expect(await controller.findOne('1')).toEqual(setor);
  });

  it('should return undefined for a non-existing setor', async () => {
    vi.spyOn(prisma.setor, 'findUniqueOrThrow').mockResolvedValue(null);

    expect(await controller.findOne('999')).toBeNull();
  });
});
