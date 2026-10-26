import { EscolaridadeModule } from './../configuracoes/escolaridade/escolaridade.module.js';
import { Module } from '@nestjs/common';
import { PessoaService } from './pessoa.service.js';
import { PessoaController } from './pessoa.controller.js';
import { EstadoCivilModule } from 'src/configuracoes/estado-civil/estado-civil.module.js';
import { EnderecoModule } from 'src/endereco/endereco.module.js';
import { SituacaoReligiosaModule } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.module.js';
import { SaoPedroModule } from 'src/external/sao-pedro/sao-pedro.module.js';
import { ComunidadeModule } from 'src/comunidade/comunidade.module.js';
import { CasalService } from './casal/casal.service.js';
import { ContatoService } from './contato/contato.service.js';

@Module({
  controllers: [PessoaController],
  providers: [PessoaService, CasalService, ContatoService],
  exports: [PessoaService],
  imports: [
    EscolaridadeModule,
    EstadoCivilModule,
    SituacaoReligiosaModule,
    EnderecoModule,
    SaoPedroModule,
    ComunidadeModule,
  ],
})
export class PessoaModule {}
