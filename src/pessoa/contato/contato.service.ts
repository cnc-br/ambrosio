import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';

@Injectable()
export class ContatoService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly saoPedroContatoService: SaoPedroContatoService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(pessoaId: number, createPessoaContatoDto: CreatePessoaContatoDto) {
    this.validateCreateAbility('pessoa');

    const pessoa = await this.prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaId },
      select: { externalId: true },
    });

    return this.saoPedroContatoService.createExternalContato(
      pessoa.externalId,
      createPessoaContatoDto,
    );
  }
}