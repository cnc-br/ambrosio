import { Module } from '@nestjs/common';
import { RegiaoModule } from '../regiao/regiao.module.js';
import { SetorService } from './setor.service.js';
import { SetorController } from './setor.controller.js';

@Module({
  controllers: [SetorController],
  providers: [SetorService],
  imports: [RegiaoModule],
  exports: [SetorService],
})
export class SetorModule {}
