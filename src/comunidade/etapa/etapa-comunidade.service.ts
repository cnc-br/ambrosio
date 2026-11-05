import { Injectable } from '@nestjs/common';
import { CreateEtapaDto } from './dto/create-etapa.dto.js';
import { UpdateEtapaDto } from './dto/update-etapa.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ComunidadeService } from '../comunidade.service.js';
import { ComunidadeEtapa } from 'neocatecumenal';

@Injectable()
export class EtapaComunidadeService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly comunidadeService: ComunidadeService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(comunidadeId: number, createEtapaDto: CreateEtapaDto) {
    this.validateCreateAbility('etapa');
    this.logger.log(`Creating etapa for comunidade ${comunidadeId}`);

    const etapa = await this.prisma.comunidadeEtapa.create({
      data: {
        comunidadeId,
        etapaId: createEtapaDto.etapaId,
        equipeId: createEtapaDto.equipeId,
        dataInicio: createEtapaDto.dataInicio,
        observacao: createEtapaDto.observacao,
        localConvivencia: createEtapaDto.localConvivencia,
      },
    });

    // Atualiza a etapaAtualId da comunidade para a etapa recém-criada
    await this.comunidadeService.update(etapa.comunidadeId, {
      etapaAtualId: etapa.etapaId,
    });

    return etapa;
  }

  findAll(comunidadeId: number): Promise<ComunidadeEtapa[]> {
    this.validateReadAbility('etapa');
    // TODO: futuramente vai precisar de listar a equipe. Nesse caso precisa criar um arquivo serializador
    return this.prisma.comunidadeEtapa.findMany({
      where: { comunidadeId },
      include: {
        etapa: true,
      },
      orderBy: { etapaId: 'asc' },
    });
  }

  findOne(comunidadeId: number, id: number): Promise<ComunidadeEtapa> {
    this.validateReadAbility('etapa');
    return this.prisma.comunidadeEtapa.findFirstOrThrow({
      where: { id, comunidadeId },
      include: {
        etapa: true,
      },
    });
  }

  async update(id: number, dto: UpdateEtapaDto) {
    this.validateUpdateAbility('etapa');

    return this.prisma.comunidadeEtapa.update({
      where: { id },
      data: {
        etapaId: dto.etapaId,
        equipeId: dto.equipeId,
        localConvivencia: dto.localConvivencia,
        dataInicio: dto.dataInicio,
        observacao: dto.observacao,
      },
    });
  }

  async remove(comunidadeId: number, id: number) {
    this.validateDeleteAbility('etapa');

    await this.prisma.comunidadeEtapa.findFirstOrThrow({
      where: { id, comunidadeId },
      select: { id: true },
    });

    this.logger.log(`Removendo etapa ${id} da comunidade ${comunidadeId}`);

    return this.prisma.comunidadeEtapa.delete({
      where: { id },
    });
  }
}
