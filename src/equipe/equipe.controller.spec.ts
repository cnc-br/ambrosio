import { Test, TestingModule } from '@nestjs/testing';
import { EquipeController } from './equipe.controller.js';
import { EquipeService } from './equipe.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { TipoEquipeService } from 'src/configuracoes/tipo-equipe/tipo-equipe.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroAuthService } from 'src/external/sao-pedro/sao-pedro-auth.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { HttpModule } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

describe('EquipeController', () => {
  let controller: EquipeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipeController],
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
        JwtService
      ],
      imports: [HttpModule],
    }).compile();

    controller = await module.resolve<EquipeController>(EquipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
