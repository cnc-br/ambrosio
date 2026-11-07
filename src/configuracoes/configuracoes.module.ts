import { Module } from '@nestjs/common';
import { EscolaridadeModule } from './escolaridade/escolaridade.module.js';
import { EstadoCivilModule } from './estado-civil/estado-civil.module.js';
import { TipoDioceseModule } from './tipo-diocese/tipo-diocese.module.js';
import { TipoEquipeModule } from './tipo-equipe/tipo-equipe.module.js';
import { TipoLocalidadeModule } from './tipo-localidade/tipo-localidade.module.js';
import { PaisModule } from './pais/pais.module.js';
import { EstadoModule } from './estado/estado.module.js';
import { CidadeModule } from './cidade/cidade.module.js';
import { DioceseModule } from 'src/diocese/diocese.module.js';
import { SituacaoReligiosaModule } from './situacao-religiosa/situacao-religiosa.module.js';
import { EtapasService } from './etapas/etapas.service.js';
import { EtapasController } from './etapas/etapas.controller.js';
import { AvisosModule } from './avisos/avisos.module.js';

@Module({
  imports: [
    EscolaridadeModule,
    EstadoCivilModule,
    TipoDioceseModule,
    DioceseModule,
    TipoEquipeModule,
    TipoLocalidadeModule,
    PaisModule,
    EstadoModule,
    CidadeModule,
    SituacaoReligiosaModule,
    AvisosModule,
  ],
  providers: [EtapasService],
  controllers: [EtapasController],
})
export class ConfiguracoesModule {}
