import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CreateMacroRegiaoDto } from './dto/create-macro-regiao.dto.js';
import { UpdateMacroRegiaoDto } from './dto/update-macro-regiao.dto.js';

@Injectable()
export class MacroRegiaoService extends BaseService {
  constructor(
    private prisma: PrismaService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  findAll() {
    return this.prisma.macroRegiao.findMany();
  }

  findOne(id: number) {
    return this.prisma.macroRegiao.findUniqueOrThrow({
      where: { id },
    });
  }

  async create(createMacroRegiaoDto: CreateMacroRegiaoDto, userId?: string) {
    this.validateCreateAbility('macroRegiao');

    return this.prisma.macroRegiao.create({
      data: {
        descricao: createMacroRegiaoDto.descricao,
        ativo: createMacroRegiaoDto.ativo ?? true,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
    });
  }

  async update(
    id: number,
    updateMacroRegiaoDto: UpdateMacroRegiaoDto,
    userId?: string,
  ) {
    this.validateUpdateAbility('macroRegiao');
    await this.findOne(id);

    return this.prisma.macroRegiao.update({
      where: { id },
      data: {
        ...(updateMacroRegiaoDto.descricao !== undefined
          ? { descricao: updateMacroRegiaoDto.descricao }
          : {}),
        ...(updateMacroRegiaoDto.ativo !== undefined
          ? { ativo: updateMacroRegiaoDto.ativo }
          : {}),
        ...(userId ? { atualizadoPorId: userId } : {}),
      },
    });
  }
}
