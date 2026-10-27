import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { JwtService } from '@nestjs/jwt';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { EstadoCivilService } from 'src/configuracoes/estado-civil/estado-civil.service.js';
import { EscolaridadeService } from 'src/configuracoes/escolaridade/escolaridade.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';

describe('UsersController', () => {
  let controller: UsersController;
  let prismaService: PrismaService;
  let jwtservice: JwtService;
  let abilityService: CaslAbilityService;
  let pessoaService: PessoaService;
  let saoPedroPessoaService: SaoPedroPessoaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      imports: [HttpModule],
      providers: [
        UsersService,
        PrismaService,
        JwtService,
        CaslAbilityService,
        PessoaService,
        EstadoCivilService,
        EscolaridadeService,
        SaoPedroContatoService,
        SaoPedroAuthService,
        SituacaoReligiosaService,
        {
          provide: SaoPedroPessoaService,
          useValue: {
            getPessoas: vi.fn().mockResolvedValue([]),
            postExternalPessoa: vi
              .fn()
              .mockResolvedValue({ id: 1, nome: 'João' }),
          },
        },
      ],
    }).compile();

    controller = await module.resolve<UsersController>(UsersController);
    pessoaService = await module.resolve<PessoaService>(PessoaService);
    prismaService = module.get<PrismaService>(PrismaService);
    saoPedroPessoaService = module.get<SaoPedroPessoaService>(
      SaoPedroPessoaService,
    );
    jwtservice = module.get<JwtService>(JwtService);
    abilityService =
      await module.resolve<CaslAbilityService>(CaslAbilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(prismaService).toBeDefined();
    expect(jwtservice).toBeDefined();
    expect(abilityService).toBeDefined();
    expect(pessoaService).toBeDefined();
    expect(saoPedroPessoaService).toBeDefined();
  });
});
