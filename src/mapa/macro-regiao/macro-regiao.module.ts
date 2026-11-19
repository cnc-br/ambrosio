import { Module } from '@nestjs/common';
import { MacroRegiaoService } from './macro-regiao.service.js';
import { MacroRegiaoController } from './macro-regiao.controller.js';

@Module({
  controllers: [MacroRegiaoController],
  providers: [MacroRegiaoService],
  exports: [MacroRegiaoService],
})
export class MacroRegiaoModule {}
