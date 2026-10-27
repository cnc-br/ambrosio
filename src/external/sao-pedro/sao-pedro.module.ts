import { Module } from '@nestjs/common';
import { SaoPedroPessoaService } from './sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from './sao-pedro-contato.service.js';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [SaoPedroPessoaService, SaoPedroContatoService, SaoPedroAuthService],
  exports: [SaoPedroPessoaService, SaoPedroContatoService],
})
export class SaoPedroModule {}