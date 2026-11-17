import { describe, expect, it } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import {
  AuditoriaInterceptor,
  removerCamposAuditoria,
} from './auditoria.interceptor.js';

describe('removerCamposAuditoria', () => {
  it('remove os campos de auditoria de um objeto simples', () => {
    const result = removerCamposAuditoria({
      id: 1,
      descricao: 'Comunidade 1',
      cadastradoPorId: 'usuario-autor',
      atualizadoPorId: 'usuario-editor',
    });

    expect(result).toEqual({ id: 1, descricao: 'Comunidade 1' });
  });

  it('remove os campos de auditoria de arrays', () => {
    const result = removerCamposAuditoria([
      { id: 1, cadastradoPorId: 'a', atualizadoPorId: 'b' },
      { id: 2, cadastradoPorId: 'c', atualizadoPorId: 'd' },
    ]);

    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('remove os campos de auditoria em estruturas aninhadas', () => {
    const result = removerCamposAuditoria({
      server: '/x',
      data: {
        id: 1,
        paroquia: {
          id: 2,
          cadastradoPorId: 'autor',
          atualizadoPorId: 'editor',
        },
      },
    });

    expect(result).toEqual({
      server: '/x',
      data: { id: 1, paroquia: { id: 2 } },
    });
  });

  it('preserva datas e valores primitivos', () => {
    const data = new Date('2026-01-01T00:00:00.000Z');
    const result = removerCamposAuditoria({ createdAt: data, total: 1 });

    expect(result).toEqual({ createdAt: data, total: 1 });
  });

  it('preserva instâncias de classes', () => {
    class DecimalMock {
      constructor(private readonly value: string) {}
      toString() {
        return this.value;
      }
    }
    const decimal = new DecimalMock('1.5');

    const result = removerCamposAuditoria({ valor: decimal }) as {
      valor: DecimalMock;
    };

    expect(result.valor).toBe(decimal);
  });
});

describe('AuditoriaInterceptor', () => {
  it('sanitiza o payload emitido pelo handler', async () => {
    const interceptor = new AuditoriaInterceptor();
    const context = {} as ExecutionContext;

    const observable = interceptor.intercept(context, {
      handle: () =>
        of({
          data: [{ id: 1, cadastradoPorId: 'a', atualizadoPorId: 'b' }],
        }),
    });

    await expect(firstValueFrom(observable)).resolves.toEqual({
      data: [{ id: 1 }],
    });
  });
});
