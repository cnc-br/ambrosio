import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service.js';
import { MaintenanceService } from '../maintenance.service.js';

export const AVISO_EXPIRATION_JOB_NAME = 'aviso-expiration';

@Injectable()
export class AvisoExpirationJob {
  private readonly logger = new Logger(AvisoExpirationJob.name);

  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron('0 * * * *', { timeZone: 'America/Sao_Paulo' })
  async execute(): Promise<void> {
    this.logger.log(`Iniciando job "${AVISO_EXPIRATION_JOB_NAME}".`);

    await this.maintenanceService.runTracked(
      AVISO_EXPIRATION_JOB_NAME,
      async () => {
        const { count } = await this.prisma.aviso.deleteMany({
          where: { dataFim: { lt: new Date() } },
        });

        this.logger.log(
          `Job "${AVISO_EXPIRATION_JOB_NAME}" removeu ${count} aviso(s) com data de término vencida.`,
        );
      },
    );

    this.logger.log(`Job "${AVISO_EXPIRATION_JOB_NAME}" finalizado com sucesso.`);
  }
}
