import { Injectable } from '@nestjs/common';
import { CreateHistoricoDto } from './dto/create-historico.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SEM_INFORMACAO } from 'src/commons/constants/constants.js';

@Injectable()
export class HistoricoService extends BaseService {
  constructor(
    private prisma: PrismaService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  create(createHistoricoDto: CreateHistoricoDto, userId?: string) {
    const descricao = `Comunidade: ${createHistoricoDto.numeroComunidade}
      # Catequistas: ${createHistoricoDto.catequistas ?? SEM_INFORMACAO}
      # Local Convivência: ${createHistoricoDto.localConvivencia ?? SEM_INFORMACAO}
      # Data Convivência: ${createHistoricoDto.dataConvivencia?.toString() ?? SEM_INFORMACAO}
      # Responsável: ${createHistoricoDto.responsavel ?? SEM_INFORMACAO}
      # Co-Responsável: ${createHistoricoDto.coResponsavel ?? SEM_INFORMACAO}
      # Observação: ${createHistoricoDto.descricao}`;

    return this.prisma.comunidadeHistorico.create({
      data: {
        comunidadeId: createHistoricoDto.comunidadeId,
        descricao,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.comunidadeHistorico.findMany();
  }

  findOne(id: number) {
    return this.prisma.comunidadeHistorico.findUnique({ where: { id } });
  }
}
