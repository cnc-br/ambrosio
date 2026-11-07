import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from 'src/prisma.service.js';
import {
  ScheduledJobExecution,
  ScheduledJobStatus,
} from 'src/prisma/generated-client.js';
import { MaintenanceService } from './maintenance.service.js';

const startedAt = new Date('2026-11-05T12:00:00.000Z');

const buildExecution = (
  overrides: Partial<ScheduledJobExecution> = {},
): ScheduledJobExecution => ({
  id: 'execucao-1',
  jobName: 'example',
  status: ScheduledJobStatus.RUNNING,
  startedAt,
  finishedAt: null,
  durationMs: null,
  error: null,
  ...overrides,
});

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let create: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let findMany: ReturnType<typeof vi.fn>;
  let deleteMany: ReturnType<typeof vi.fn>;
  let loggerError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    create = vi.fn();
    update = vi.fn();
    findMany = vi.fn();
    deleteMany = vi.fn();

    const prisma = {
      scheduledJobExecution: { create, update, findMany, deleteMany },
    } as unknown as PrismaService;

    service = new MaintenanceService(prisma);
    loggerError = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('inicia a execução com status RUNNING e o nome do job', async () => {
    const execution = buildExecution();
    create.mockResolvedValue(execution);

    const result = await service.startExecution('example');

    expect(create).toHaveBeenCalledWith({
      data: { jobName: 'example', status: ScheduledJobStatus.RUNNING },
    });
    expect(result).toBe(execution);
  });

  it('finaliza com sucesso preenchendo finishedAt e durationMs', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(startedAt.getTime() + 1_500));
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.SUCCESS }));

    await service.finishSuccess('execucao-1', startedAt);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'execucao-1' },
      data: {
        status: ScheduledJobStatus.SUCCESS,
        finishedAt: new Date(startedAt.getTime() + 1_500),
        durationMs: 1_500,
      },
    });
  });

  it('finaliza com falha preenchendo finishedAt, durationMs e a mensagem', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(startedAt.getTime() + 2_000));
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.FAILED }));

    await service.finishFailure(
      'execucao-1',
      startedAt,
      new Error('falha na rotina'),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'execucao-1' },
      data: {
        status: ScheduledJobStatus.FAILED,
        finishedAt: new Date(startedAt.getTime() + 2_000),
        durationMs: 2_000,
        error: 'falha na rotina',
      },
    });
  });

  it('trunca a mensagem de erro em 1000 caracteres e aceita erro não-Error', async () => {
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.FAILED }));

    await service.finishFailure('execucao-1', startedAt, 'x'.repeat(1_500));
    await service.finishFailure('execucao-2', startedAt, { detalhe: 'objeto' });

    expect(update.mock.calls[0][0].data.error).toHaveLength(1_000);
    expect(update.mock.calls[1][0].data.error).toBe('[object Object]');
  });

  it('não permite duração negativa quando o relógio recua', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(startedAt.getTime() - 10));
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.SUCCESS }));

    await service.finishSuccess('execucao-1', startedAt);

    expect(update.mock.calls[0][0].data.durationMs).toBe(0);
  });

  it('runTracked executa a rotina e registra SUCCESS', async () => {
    const execution = buildExecution();
    create.mockResolvedValue(execution);
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.SUCCESS }));
    const routine = vi.fn().mockResolvedValue('resultado');

    const result = await service.runTracked('example', routine);

    expect(routine).toHaveBeenCalledTimes(1);
    expect(result).toBe('resultado');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'execucao-1' },
        data: expect.objectContaining({ status: ScheduledJobStatus.SUCCESS }),
      }),
    );
  });

  it('runTracked registra FAILED e relança o erro original da rotina', async () => {
    const execution = buildExecution();
    const originalError = new Error('rotina quebrou');
    create.mockResolvedValue(execution);
    update.mockResolvedValue(buildExecution({ status: ScheduledJobStatus.FAILED }));
    const routine = vi.fn().mockRejectedValue(originalError);

    await expect(service.runTracked('example', routine)).rejects.toBe(originalError);

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'execucao-1' },
        data: expect.objectContaining({
          status: ScheduledJobStatus.FAILED,
          error: 'rotina quebrou',
        }),
      }),
    );
  });

  it('runTracked preserva o erro original quando a persistência da falha também falha', async () => {
    const execution = buildExecution();
    const originalError = new Error('rotina quebrou');
    const persistenceError = new Error('banco indisponível');
    create.mockResolvedValue(execution);
    update.mockRejectedValue(persistenceError);
    const routine = vi.fn().mockRejectedValue(originalError);

    await expect(service.runTracked('example', routine)).rejects.toBe(originalError);

    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('execucao-1'),
    );
    expect(loggerError).toHaveBeenCalledWith(
      expect.stringContaining('banco indisponível'),
    );
  });

  it('runTracked não executa a rotina quando o registro inicial falha', async () => {
    const startError = new Error('falha ao criar execução');
    create.mockRejectedValue(startError);
    const routine = vi.fn();

    await expect(service.runTracked('example', routine)).rejects.toBe(startError);

    expect(routine).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(expect.stringContaining('example'));
  });

  it('lista o histórico com paginação e ordenação decrescente', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll(2, 10);

    expect(findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      orderBy: { startedAt: 'desc' },
    });
  });

  it('converte page e limit recebidos como string da query HTTP', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll(
      '2' as unknown as number,
      '10' as unknown as number,
    );

    expect(findMany).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      orderBy: { startedAt: 'desc' },
    });
  });

  it('usa page=1 e limit=50 quando a paginação não é informada', async () => {
    findMany.mockResolvedValue([]);

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 50,
      orderBy: { startedAt: 'desc' },
    });
  });

  it('exclui somente execuções concluídas e retorna a quantidade', async () => {
    deleteMany.mockResolvedValue({ count: 3 });

    const result = await service.deleteHistory();

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        status: {
          in: [ScheduledJobStatus.SUCCESS, ScheduledJobStatus.FAILED],
        },
      },
    });
    expect(result).toEqual({ deleted: 3 });
  });
});
