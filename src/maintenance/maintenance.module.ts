import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceService } from './maintenance.service.js';
import { ExampleJob } from './jobs/example.job.js';
import { AvisoExpirationJob } from './jobs/aviso-expiration.job.js';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, ExampleJob, AvisoExpirationJob],
})
export class MaintenanceModule {}
