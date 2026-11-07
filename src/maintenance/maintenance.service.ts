import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import {
  ScheduledJobExecution,
  ScheduledJobStatus,
} from 'src/prisma/generated-client.js';
import {
  LIMIT_DEFAULT,
  PAGE_DEFAULT,
} from 'src/commons/constants/constants.js';

const MAX_ERROR_LENGTH = 1_000;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  startExecution(jobName: string): Promise<ScheduledJobExecution> {
    return this.prisma.scheduledJobExecution.create({
      data: {
        jobName,
        status: ScheduledJobStatus.RUNNING,
      },
    });
  }

  finishSuccess(
    id: string,
    startedAt: Date,
  ): Promise<ScheduledJobExecution> {
    return this.prisma.scheduledJobExecution.update({
      where: { id },
      data: {
        status: ScheduledJobStatus.SUCCESS,
        finishedAt: new Date(),
        durationMs: this.calculateDuration(startedAt),
      },
    });
  }

  finishFailure(
    id: string,
    startedAt: Date,
    error: unknown,
  ): Promise<ScheduledJobExecution> {
    return this.prisma.scheduledJobExecution.update({
      where: { id },
      data: {
        status: ScheduledJobStatus.FAILED,
        finishedAt: new Date(),
        durationMs: this.calculateDuration(startedAt),
        error: this.describeError(error),
      },
    });
  }

  /**
   * Executa uma rotina de manutenção registrando todo o ciclo de vida no
   * histórico de execuções.
   *
   * O job não deve duplicar `try/catch` de rastreabilidade: basta chamar este
   * método com o nome do job e a rotina a executar.
   *
   * @example
   * ```ts
   * await this.maintenanceService.runTracked('example', async () => {
   *   this.logger.log('Rotina demonstrativa executada.');
   * });
   * ```
   */
  async runTracked<T>(
    jobName: string,
    routine: () => Promise<T>,
  ): Promise<T> {
    let execution: ScheduledJobExecution;

    try {
      execution = await this.startExecution(jobName);
    } catch (error) {
      this.logger.error(
        `Falha ao iniciar o rastreamento do job "${jobName}": ${this.describeError(error)}`,
      );
      throw error;
    }

    let result: T;

    try {
      result = await routine();
    } catch (error) {
      await this.trackFailure(jobName, execution, error);
      throw error;
    }

    try {
      await this.finishSuccess(execution.id, execution.startedAt);
    } catch (error) {
      this.logger.error(
        `Falha ao registrar o sucesso do job "${jobName}" (execução ${execution.id}): ${this.describeError(error)}`,
      );
      throw error;
    }

    return result;
  }

  async findAll(
    page?: number,
    limit?: number,
  ): Promise<ScheduledJobExecution[]> {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const currentPage =
      Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : PAGE_DEFAULT;
    const currentLimit =
      Number.isInteger(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : LIMIT_DEFAULT;

    return this.prisma.scheduledJobExecution.findMany({
      skip: (currentPage - 1) * currentLimit,
      take: currentLimit,
      orderBy: { startedAt: 'desc' },
    });
  }

  async deleteHistory(): Promise<{ deleted: number }> {
    const result = await this.prisma.scheduledJobExecution.deleteMany({
      where: {
        status: {
          in: [ScheduledJobStatus.SUCCESS, ScheduledJobStatus.FAILED],
        },
      },
    });

    return { deleted: result.count };
  }

  private async trackFailure(
    jobName: string,
    execution: ScheduledJobExecution,
    error: unknown,
  ): Promise<void> {
    this.logger.error(
      `Job "${jobName}" falhou (execução ${execution.id}): ${this.describeError(error)}`,
    );

    try {
      await this.finishFailure(execution.id, execution.startedAt, error);
    } catch (persistenceError) {
      this.logger.error(
        `Falha ao registrar o erro do job "${jobName}" (execução ${execution.id}): ${this.describeError(persistenceError)}`,
      );
    }
  }

  private calculateDuration(startedAt: Date): number {
    return Math.max(0, Date.now() - startedAt.getTime());
  }

  private describeError(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return message.slice(0, MAX_ERROR_LENGTH);
  }
}
