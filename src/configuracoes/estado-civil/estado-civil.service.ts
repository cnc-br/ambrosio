import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { CreateEstadoCivilDto } from './dto/create-estado-civil.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';

@Injectable()
export class EstadoCivilService extends BaseService {
  constructor(
    private prisma: PrismaService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  findAll() {
    return this.prisma.estadoCivil.findMany();
  }

  findOne(id: number) {
    return this.prisma.estadoCivil.findFirstOrThrow({
      where: { id: +id },
    });
  }

  create(createEstadoCivilDto: CreateEstadoCivilDto) {
    this.validateCreateAbility('estadoCivil');

    return this.prisma.estadoCivil.create({
      data: createEstadoCivilDto,
    });
  }
}
