import { Test, TestingModule } from '@nestjs/testing';
import { EquipeService } from './equipe.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { TipoEquipeService } from 'src/configuracoes/tipo-equipe/tipo-equipe.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

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
});
