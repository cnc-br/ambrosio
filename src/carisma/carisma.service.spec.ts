import { Test, TestingModule } from '@nestjs/testing';
import { CarismaService } from './carisma.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { HttpModule } from '@nestjs/axios';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

describe('CarismaService', () => {
  let service: CarismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarismaService,
        PrismaService,
        CaslAbilityService,
        PessoaService,
        SituacaoReligiosaService,
        SaoPedroAuthService,
        SaoPedroPessoaService,
        SaoPedroContatoService
      ],
      imports: [HttpModule],
    }).compile();

    service = await module.resolve<CarismaService>(CarismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
