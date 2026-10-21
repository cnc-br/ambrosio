import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let abilityService: CaslAbilityService;
  let pessoaServiceMock: { findOne: ReturnType<typeof vi.fn>; findOneByCpf: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    pessoaServiceMock = {
      findOne: vi.fn(),
      findOneByCpf: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        CaslAbilityService,
        {
          provide: PessoaService,
          useValue: pessoaServiceMock,
        },
        {
          provide: PrismaService,
          useValue: {
            create: vi.fn(),
            user: {
              findUniqueOrThrow: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = await module.resolve<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    abilityService = await module.resolve<CaslAbilityService>(
      CaslAbilityService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(abilityService).toBeDefined();
  });

  describe('findOne', () => {
    const baseUser = {
      id: 'user-1',
      email: 'carmem@neocatecumenal.com.es',
      password: 'hash-super-secreto',
      role: 'ADMIN',
      whatsapp: '16999999999',
      verifiedWhatsapp: false,
      active: true,
      createdAt: new Date('2026-10-20T10:00:00Z'),
      updatedAt: new Date('2026-10-21T10:00:00Z'),
      resetPasswordToken: null,
      resetPasswordExpires: null,
      usuarioParoquias: [
        { paroquia: { id: 1, descricao: 'Paróquia São José' } },
      ],
    };

    it('compõe a pessoa vinculada via pessoaService e não expõe dados sensíveis', async () => {
      const pessoaMock = {
        id: 42,
        externalId: 'id-externo-1',
        nome: 'Carmem Hernandez',
        cpf: '77722233345',
      };
      pessoaServiceMock.findOne.mockResolvedValue(pessoaMock as never);
      vi.mocked(prismaService.user.findUniqueOrThrow).mockResolvedValue({
        ...baseUser,
        pessoaId: 42,
      } as never);

      const result = await service.findOne('user-1');

      expect(pessoaServiceMock.findOne).toHaveBeenCalledWith(42);
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'carmem@neocatecumenal.com.es',
        pessoaId: 42,
        pessoa: pessoaMock,
        paroquias: [{ id: 1, descricao: 'Paróquia São José' }],
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('resetPasswordToken');
      expect(result).not.toHaveProperty('resetPasswordExpires');
    });

    it('não chama pessoaService e omite pessoa quando não há pessoaId', async () => {
      vi.mocked(prismaService.user.findUniqueOrThrow).mockResolvedValue({
        ...baseUser,
        pessoaId: null,
        usuarioParoquias: [],
      } as never);

      const result = await service.findOne('user-sem-pessoa');

      expect(pessoaServiceMock.findOne).not.toHaveBeenCalled();
      expect(result).not.toHaveProperty('pessoa');
      expect(result).not.toHaveProperty('pessoaId');
      expect(result.paroquias).toEqual([]);
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('findByIdWithPassword', () => {
    it('devolve o registro cru com o hash de senha, sem passar pelo serializer', async () => {
      const raw = {
        id: 'user-1',
        email: 'carmem@neocatecumenal.com.es',
        password: 'hash-super-secreto',
        active: true,
      };
      vi.mocked(prismaService.user.findUniqueOrThrow).mockResolvedValue(raw as never);

      const result = await service.findByIdWithPassword('user-1');

      expect(prismaService.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({ password: true, active: true }),
      });
      expect(result).toMatchObject({
        id: 'user-1',
        password: 'hash-super-secreto',
        active: true,
      });
    });
  });
});