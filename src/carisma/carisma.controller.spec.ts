import { Test, TestingModule } from '@nestjs/testing';
import { CarismaController } from './carisma.controller.js';
import { CarismaService } from './carisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

describe('CarismaController', () => {
  let controller: CarismaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarismaController],
      providers: [
        CarismaService,
        CaslAbilityService,
        PrismaService,
        PessoaService,
        SituacaoReligiosaService,
        SaoPedroAuthService,
        SaoPedroPessoaService,
        SaoPedroContatoService,
        JwtService
      ],
      imports: [HttpModule],
    }).compile();

    controller = await module.resolve<CarismaController>(CarismaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
