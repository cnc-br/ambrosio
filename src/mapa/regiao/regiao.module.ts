import { Module } from '@nestjs/common';
import { MacroRegiaoModule } from '../macro-regiao/macro-regiao.module.js';
import { RegiaoService } from './regiao.service.js';
import { RegiaoController } from './regiao.controller.js';

@Module({
  controllers: [RegiaoController],
  providers: [RegiaoService],
  imports: [MacroRegiaoModule],
  exports: [RegiaoService],
})
export class RegiaoModule {}
