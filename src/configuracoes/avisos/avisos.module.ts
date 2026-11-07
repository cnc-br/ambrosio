import { Module } from '@nestjs/common';
import { AvisosController } from './avisos.controller.js';
import { AvisosService } from './avisos.service.js';

@Module({
  controllers: [AvisosController],
  providers: [AvisosService],
})
export class AvisosModule {}
