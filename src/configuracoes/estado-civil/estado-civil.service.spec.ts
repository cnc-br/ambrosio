import { describe, expect, it, vi } from 'vitest';
import { EstadoCivilService } from './estado-civil.service.js';

describe('EstadoCivilService', () => {
  const criarServico = (create: ReturnType<typeof vi.fn>) => {
    const service = new EstadoCivilService(
      { estadoCivil: { create } } as never,
      { ability: { can: vi.fn(() => true) } } as never,
    );
    return service;
  };

  it('create grava o usuário autenticado na auditoria', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = criarServico(create);

    await service.create({ descricao: 'CASADO' }, 'usuario-autor');

    expect(create).toHaveBeenCalledWith({
      data: {
        descricao: 'CASADO',
        cadastradoPorId: 'usuario-autor',
        atualizadoPorId: 'usuario-autor',
      },
    });
  });

  it('create sem usuário grava auditoria nula', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1 });
    const service = criarServico(create);

    await service.create({ descricao: 'SOLTEIRO' });

    expect(create).toHaveBeenCalledWith({
      data: {
        descricao: 'SOLTEIRO',
        cadastradoPorId: null,
        atualizadoPorId: null,
      },
    });
  });
});
