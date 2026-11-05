import { Module } from '@nestjs/common';
import { ComunidadeController } from './comunidade.controller.js';
import { ParoquiaModule } from 'src/paroquia/paroquia.module.js';
import { ComunidadeService } from './comunidade.service.js';
import { HistoricoService } from './historico/historico.service.js';
import { EtapaComunidadeService } from './etapa/etapa-comunidade.service.js';
import { EtapaComunidadeController } from './etapa/etapa-comunidade.controller.js';
import { SaoPedroModule } from 'src/external/sao-pedro/sao-pedro.module.js';

@Module({
  controllers: [ComunidadeController, EtapaComunidadeController],
  providers: [ComunidadeService, HistoricoService, EtapaComunidadeService],
  imports: [ParoquiaModule, SaoPedroModule],
  exports: [ComunidadeService],
})
export class ComunidadeModule {}
