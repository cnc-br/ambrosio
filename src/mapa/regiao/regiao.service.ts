import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { MacroRegiaoService } from '../macro-regiao/macro-regiao.service.js';
import { CreateRegiaoDto } from './dto/create-regiao.dto.js';
import { UpdateRegiaoDto } from './dto/update-regiao.dto.js';

@Injectable()
export class RegiaoService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly macroRegiaoService: MacroRegiaoService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  findAll() {
    return this.prisma.regiao.findMany({
      include: {
        macroRegiao: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.regiao.findUniqueOrThrow({
      where: { id },
      include: { macroRegiao: true },
    });
  }

  async create(createRegiaoDto: CreateRegiaoDto, userId?: string) {
    this.validateCreateAbility('regiao');
    await this.macroRegiaoService.findOne(createRegiaoDto.macroRegiao.id);

    return this.prisma.regiao.create({
      data: {
        descricao: createRegiaoDto.descricao,
        ativo: createRegiaoDto.ativo ?? true,
        macroRegiaoId: createRegiaoDto.macroRegiao.id,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
      include: { macroRegiao: true },
    });
  }

  async update(
    id: number,
    updateRegiaoDto: UpdateRegiaoDto,
    userId?: string,
  ) {
    this.validateUpdateAbility('regiao');
    await this.findOne(id);

    const macroRegiaoId = updateRegiaoDto.macroRegiao
      ? (await this.macroRegiaoService.findOne(updateRegiaoDto.macroRegiao.id))
          .id
      : undefined;

    return this.prisma.regiao.update({
      where: { id },
      data: {
        ...(updateRegiaoDto.descricao !== undefined
          ? { descricao: updateRegiaoDto.descricao }
          : {}),
        ...(updateRegiaoDto.ativo !== undefined
          ? { ativo: updateRegiaoDto.ativo }
          : {}),
        ...(macroRegiaoId !== undefined ? { macroRegiaoId } : {}),
        ...(userId ? { atualizadoPorId: userId } : {}),
      },
      include: { macroRegiao: true },
    });
  }
}
