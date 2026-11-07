import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from 'src/prisma.service.js';
import { MaintenanceService } from '../maintenance.service.js';
import {
  AVISO_EXPIRATION_JOB_NAME,
  AvisoExpirationJob,
} from './aviso-expiration.job.js';

describe('AvisoExpirationJob', () => {
  let job: AvisoExpirationJob;
  let runTracked: ReturnType<typeof vi.fn>;
  let deleteMany: ReturnType<typeof vi.fn>;
  let loggerLog: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    runTracked = vi.fn(async (_jobName: string, routine: () => Promise<unknown>) =>
      routine(),
    );
    deleteMany = vi.fn().mockResolvedValue({ count: 2 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvisoExpirationJob,
        {
          provide: MaintenanceService,
          useValue: { runTracked },
        },
        {
          provide: PrismaService,
          useValue: { aviso: { deleteMany } },
        },
      ],
    }).compile();

    job = module.get<AvisoExpirationJob>(AvisoExpirationJob);
    loggerLog = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  it('está agendado de hora em hora em America/Sao_Paulo', () => {
    const options = Reflect.getMetadata(
      'SCHEDULE_CRON_OPTIONS',
      AvisoExpirationJob.prototype.execute,
    );

    expect(options).toMatchObject({
      cronTime: '0 * * * *',
      timeZone: 'America/Sao_Paulo',
    });
  });

  it('delega a execução rastreada ao MaintenanceService', async () => {
    await job.execute();

    expect(runTracked).toHaveBeenCalledTimes(1);
    expect(runTracked.mock.calls[0][0]).toBe(AVISO_EXPIRATION_JOB_NAME);
    expect(runTracked.mock.calls[0][1]).toEqual(expect.any(Function));
  });

  it('a rotina exclui somente avisos com dataFim no passado', async () => {
    await job.execute();

    const routine = runTracked.mock.calls[0][1] as () => Promise<unknown>;
    await routine();

    expect(deleteMany).toHaveBeenCalledWith({
      where: { dataFim: { lt: expect.any(Date) } },
    });
  });

  it('registra no log o total de avisos vencidos removidos', async () => {
    await job.execute();

    const routine = runTracked.mock.calls[0][1] as () => Promise<unknown>;
    await routine();

    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('removeu 2 aviso(s)'),
    );
  });

  it('registra o início e o resultado no log', async () => {
    await job.execute();

    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('Iniciando'),
    );
    expect(loggerLog).toHaveBeenCalledWith(
      expect.stringContaining('finalizado com sucesso'),
    );
  });
});
