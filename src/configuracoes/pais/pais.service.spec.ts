import { describe, expect, it, vi } from 'vitest';
import { PaisService } from './pais.service.js';

describe('PaisService', () => {
  const criarServico = (create: ReturnType<typeof vi.fn>) =>
    new PaisService(
      { pais: { create, findFirstOrThrow: vi.fn() } } as never,
      {} as never,
    );

  it('create grava o usuário autenticado na auditoria', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = criarServico(create);

    await service.create({ nome: 'Brasil' }, 'usuario-autor');

    expect(create).toHaveBeenCalledWith({
      data: {
        nome: 'Brasil',
        cadastradoPorId: 'usuario-autor',
        atualizadoPorId: 'usuario-autor',
      },
    });
  });

  it('create sem usuário grava auditoria nula', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = criarServico(create);

    await service.create({ nome: 'Brasil' });

    expect(create).toHaveBeenCalledWith({
      data: {
        nome: 'Brasil',
        cadastradoPorId: null,
        atualizadoPorId: null,
      },
    });
  });
});
