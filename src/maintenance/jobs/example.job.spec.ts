import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MaintenanceService } from '../maintenance.service.js';
import { EXAMPLE_JOB_NAME, ExampleJob } from './example.job.js';

describe('ExampleJob', () => {
  let job: ExampleJob;
  let runTracked: ReturnType<typeof vi.fn>;
  let loggerLog: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runTracked = vi.fn(async (_jobName: string, routine: () => Promise<void>) =>
      routine(),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExampleJob,
        {
          provide: MaintenanceService,
          useValue: { runTracked },
        },
      ],
    }).compile();

    job = module.get<ExampleJob>(ExampleJob);
    loggerLog = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  it('está agendado diariamente às 02:00 em America/Sao_Paulo', () => {
    const options = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      ExampleJob.prototype.execute,
    );

    expect(options).toMatchObject({
      cronTime: '0 0 2 * * *',
      timeZone: 'America/Sao_Paulo',
    });
  });

  it('delega a execução rastreada ao MaintenanceService', async () => {
    await job.execute();

    expect(runTracked).toHaveBeenCalledTimes(1);
    expect(runTracked.mock.calls[0][0]).toBe(EXAMPLE_JOB_NAME);
    expect(runTracked.mock.calls[0][1]).toEqual(expect.any(Function));
  });

  it('registra o início e o resultado no log', async () => {
    await job.execute();

    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('Iniciando'),
    );
    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('Rotina demonstrativa'),
    );
    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('finalizado com sucesso'),
    );
  });

  it('a rotina demonstrativa apenas registra log, sem escrita de negócio', async () => {
    await job.execute();

    const routine = runTracked.mock.calls[0][1] as () => Promise<void>;
    await routine();

    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('sem alterar dados de negócio'),
    );
  });
});
