import { Injectable } from '@nestjs/common';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { RegiaoService } from '../regiao/regiao.service.js';
import { CreateSetorDto } from './dto/create-setor.dto.js';
import { UpdateSetorDto } from './dto/update-setor.dto.js';

@Injectable()
export class SetorService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly regiaoService: RegiaoService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  findAll(regiaoId?: number) {
    return this.prisma.setor.findMany({
      where: regiaoId ? { regiaoId } : undefined,
      include: {
        regiao: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.setor.findUniqueOrThrow({
      where: { id },
      include: {
        regiao: true,
      },
    });
  }

  async create(createSetorDto: CreateSetorDto, userId?: string) {
    this.validateCreateAbility('setor');
    await this.regiaoService.findOne(createSetorDto.regiao.id);

    return this.prisma.setor.create({
      data: {
        descricao: createSetorDto.descricao,
        ativo: createSetorDto.ativo ?? true,
        regiaoId: createSetorDto.regiao.id,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
      include: { regiao: true },
    });
  }

  async update(id: number, updateSetorDto: UpdateSetorDto, userId?: string) {
    this.validateUpdateAbility('setor');
    await this.findOne(id);

    const regiaoId = updateSetorDto.regiao
      ? (await this.regiaoService.findOne(updateSetorDto.regiao.id)).id
      : undefined;

    return this.prisma.setor.update({
      where: { id },
      data: {
        ...(updateSetorDto.descricao !== undefined
          ? { descricao: updateSetorDto.descricao }
          : {}),
        ...(updateSetorDto.ativo !== undefined
          ? { ativo: updateSetorDto.ativo }
          : {}),
        ...(regiaoId !== undefined ? { regiaoId } : {}),
        ...(userId ? { atualizadoPorId: userId } : {}),
      },
      include: { regiao: true },
    });
  }
}
