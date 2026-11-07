import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller.js';
import { MaintenanceService } from './maintenance.service.js';
import { ExampleJob } from './jobs/example.job.js';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService, ExampleJob],
})
export class MaintenanceModule {}
