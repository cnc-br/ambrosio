import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { roles } from 'src/prisma/generated-client.js';
import { DashboardIndicadoresDto } from './dto/dashboard-response.dto.js';

export const CACHE_TTL_MS = 60_000;

@Injectable()
export class DashboardService {
  private cache: DashboardIndicadoresDto | null = null;
  private cacheExpiresAt = 0;
  private inFlight: Promise<DashboardIndicadoresDto> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getIndicators(): Promise<DashboardIndicadoresDto> {
    if (this.cache && Date.now() < this.cacheExpiresAt) {
      return this.cache;
    }

    if (!this.inFlight) {
      this.inFlight = this.calculateIndicators()
        .then((indicadores) => {
          this.cache = indicadores;
          this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;
          return indicadores;
        })
        .catch((erro) => {
          this.cache = null;
          this.cacheExpiresAt = 0;
          throw erro;
        })
        .finally(() => {
          this.inFlight = null;
        });
    }

    return this.inFlight;
  }

  private async calculateIndicators(): Promise<DashboardIndicadoresDto> {
    const [
      pessoasPorSituacao,
      paroquias,
      dioceses,
      comunidades,
      equipes,
      carismas,
      carismasVinculos,
      usuarios,
      usuariosPorPapel,
    ] = await Promise.all([
      this.prisma.pessoa.groupBy({ by: ['ativo'], _count: true }),
      this.prisma.paroquia.count(),
      this.prisma.diocese.count(),
      this.prisma.comunidade.count(),
      this.prisma.equipe.count(),
      this.prisma.carisma.count(),
      this.prisma.pessoaCarisma.count(),
      this.prisma.user.count(),
      this.prisma.user.groupBy({ by: ['role'], _count: true }),
    ]);

    const porSituacao = new Map(
      pessoasPorSituacao.map((linha) => [linha.ativo, linha._count]),
    );
    const ativas = porSituacao.get(true) ?? 0;
    const inativas = porSituacao.get(false) ?? 0;

    const porPapel = Object.fromEntries(
      Object.values(roles).map((papel) => [papel, 0]),
    ) as Record<roles, number>;
    for (const linha of usuariosPorPapel) {
      porPapel[linha.role] = linha._count;
    }

    return {
      pessoas: { total: ativas + inativas, ativas, inativas },
      paroquias,
      dioceses,
      comunidades,
      equipes,
      carismas: { total: carismas, vinculos: carismasVinculos },
      usuarios: { total: usuarios, porPapel },
    };
  }
}
