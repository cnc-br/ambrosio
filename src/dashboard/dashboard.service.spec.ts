import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from 'src/prisma.service.js';
import { roles } from 'src/prisma/generated-client.js';
import { CACHE_TTL_MS, DashboardService } from './dashboard.service.js';

type PrismaMock = {
  pessoa: { groupBy: ReturnType<typeof vi.fn> };
  paroquia: { count: ReturnType<typeof vi.fn> };
  diocese: { count: ReturnType<typeof vi.fn> };
  comunidade: { count: ReturnType<typeof vi.fn> };
  equipe: { count: ReturnType<typeof vi.fn> };
  carisma: { count: ReturnType<typeof vi.fn> };
  pessoaCarisma: { count: ReturnType<typeof vi.fn> };
  user: {
    count: ReturnType<typeof vi.fn>;
    groupBy: ReturnType<typeof vi.fn>;
  };
};

const criarPrismaMock = (): PrismaMock => ({
  pessoa: { groupBy: vi.fn() },
  paroquia: { count: vi.fn() },
  diocese: { count: vi.fn() },
  comunidade: { count: vi.fn() },
  equipe: { count: vi.fn() },
  carisma: { count: vi.fn() },
  pessoaCarisma: { count: vi.fn() },
  user: { count: vi.fn(), groupBy: vi.fn() },
});

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaMock;

  beforeEach(() => {
    prisma = criarPrismaMock();

    prisma.pessoa.groupBy.mockResolvedValue([
      { ativo: true, _count: 7 },
      { ativo: false, _count: 3 },
    ]);
    prisma.paroquia.count.mockResolvedValue(12);
    prisma.diocese.count.mockResolvedValue(2);
    prisma.comunidade.count.mockResolvedValue(30);
    prisma.equipe.count.mockResolvedValue(8);
    prisma.carisma.count.mockResolvedValue(4);
    prisma.pessoaCarisma.count.mockResolvedValue(15);
    prisma.user.count.mockResolvedValue(5);
    prisma.user.groupBy.mockResolvedValue([
      { role: roles.ADMIN, _count: 3 },
      { role: roles.SECRETARIA_PAROQUIA, _count: 2 },
    ]);

    service = new DashboardService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calcula todos os indicadores a partir das contagens do Prisma', async () => {
    const indicadores = await service.getIndicators();

    expect(indicadores).toEqual({
      pessoas: { total: 10, ativas: 7, inativas: 3 },
      paroquias: 12,
      dioceses: 2,
      comunidades: 30,
      equipes: 8,
      carismas: { total: 4, vinculos: 15 },
      usuarios: {
        total: 5,
        porPapel: {
          [roles.ADMIN]: 3,
          [roles.CATEQUISTA_NACIONAL]: 0,
          [roles.CATEQUISTA_GRANDE_REGIAO]: 0,
          [roles.CATEQUISTA_REGIAO]: 0,
          [roles.CATEQUISTA_SETOR]: 0,
          [roles.CATEQUISTA_PAROQUIA]: 0,
          [roles.SECRETARIA_CNC]: 0,
          [roles.SECRETARIA_PAROQUIA]: 2,
          [roles.NAO_IDENTIFICADO]: 0,
        },
      },
    });
  });

  it('consulta pessoas agrupadas por situação e soma o total', async () => {
    await service.getIndicators();

    expect(prisma.pessoa.groupBy).toHaveBeenCalledWith({
      by: ['ativo'],
      _count: true,
    });
  });

  it('inclui todos os papéis com zero quando não há usuários', async () => {
    prisma.user.count.mockResolvedValue(0);
    prisma.user.groupBy.mockResolvedValue([]);

    const { usuarios } = await service.getIndicators();

    expect(usuarios.total).toBe(0);
    expect(Object.keys(usuarios.porPapel)).toEqual(Object.values(roles));
    expect(Object.values(usuarios.porPapel)).toEqual(
      Object.values(roles).map(() => 0),
    );
  });

  it('propaga erro de uma contagem sem devolver payload parcial', async () => {
    const erro = new Error('banco indisponível');
    prisma.diocese.count.mockRejectedValue(erro);

    await expect(service.getIndicators()).rejects.toBe(erro);
  });

  it('retorna zeros em uma base vazia', async () => {
    prisma.pessoa.groupBy.mockResolvedValue([]);
    prisma.paroquia.count.mockResolvedValue(0);
    prisma.diocese.count.mockResolvedValue(0);
    prisma.comunidade.count.mockResolvedValue(0);
    prisma.equipe.count.mockResolvedValue(0);
    prisma.carisma.count.mockResolvedValue(0);
    prisma.pessoaCarisma.count.mockResolvedValue(0);
    prisma.user.count.mockResolvedValue(0);
    prisma.user.groupBy.mockResolvedValue([]);

    const indicadores = await service.getIndicators();

    expect(indicadores.pessoas).toEqual({ total: 0, ativas: 0, inativas: 0 });
    expect(indicadores.paroquias).toBe(0);
    expect(indicadores.dioceses).toBe(0);
    expect(indicadores.comunidades).toBe(0);
    expect(indicadores.equipes).toBe(0);
    expect(indicadores.carismas).toEqual({ total: 0, vinculos: 0 });
    expect(indicadores.usuarios.total).toBe(0);
  });

  it('reutiliza o resultado dentro da janela de 60 segundos', async () => {
    vi.useFakeTimers();

    await service.getIndicators();
    await service.getIndicators();

    expect(prisma.paroquia.count).toHaveBeenCalledTimes(1);
    expect(prisma.pessoa.groupBy).toHaveBeenCalledTimes(1);
  });

  it('recalcula após a janela de 60 segundos', async () => {
    vi.useFakeTimers();

    await service.getIndicators();
    vi.advanceTimersByTime(CACHE_TTL_MS + 1);
    await service.getIndicators();

    expect(prisma.paroquia.count).toHaveBeenCalledTimes(2);
    expect(prisma.pessoa.groupBy).toHaveBeenCalledTimes(2);
  });

  it('compartilha o mesmo cálculo entre chamadas concorrentes', async () => {
    let liberarParoquias: (valor: number) => void;
    prisma.paroquia.count.mockReturnValue(
      new Promise<number>((resolve) => {
        liberarParoquias = resolve;
      }),
    );

    const primeira = service.getIndicators();
    const segunda = service.getIndicators();
    liberarParoquias(12);

    const [resultadoPrimeira, resultadoSegunda] = await Promise.all([
      primeira,
      segunda,
    ]);

    expect(prisma.paroquia.count).toHaveBeenCalledTimes(1);
    expect(resultadoPrimeira).toEqual(resultadoSegunda);
  });

  it('limpa o cache quando o cálculo falha e permite nova tentativa', async () => {
    prisma.diocese.count.mockRejectedValueOnce(new Error('banco fora'));

    await expect(service.getIndicators()).rejects.toThrow('banco fora');
    await expect(service.getIndicators()).resolves.toBeDefined();

    expect(prisma.diocese.count).toHaveBeenCalledTimes(2);
  });
});
