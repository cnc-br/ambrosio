import { Module } from '@nestjs/common';
import { CaslModule } from 'src/casl/casl.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [CaslModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
