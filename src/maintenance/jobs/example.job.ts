import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MaintenanceService } from '../maintenance.service.js';

export const EXAMPLE_JOB_NAME = 'example';

@Injectable()
export class ExampleJob {
  private readonly logger = new Logger(ExampleJob.name);

  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Cron('0 0 2 * * *', { timeZone: 'America/Sao_Paulo' })
  async execute(): Promise<void> {
    this.logger.log(`Iniciando job "${EXAMPLE_JOB_NAME}".`);

    await this.maintenanceService.runTracked(EXAMPLE_JOB_NAME, async () => {
      this.logger.log(
        'Rotina demonstrativa executada sem alterar dados de negócio.',
      );
    });

    this.logger.log(`Job "${EXAMPLE_JOB_NAME}" finalizado com sucesso.`);
  }
}
