import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';

@Injectable()
export class ContatoService extends BaseService {
  constructor(
    private prisma: PrismaService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(pessoaId: number, createPessoaContatoDto: CreatePessoaContatoDto) {
    this.validateCreateAbility('pessoa');

    return this.prisma.$transaction(async (tx) => {
      await tx.pessoa.findUniqueOrThrow({ where: { id: pessoaId } });

      if (createPessoaContatoDto.contatoPrincipal === true) {
        await tx.pessoaContato.updateMany({
          where: { pessoaId, contatoPrincipal: true },
          data: { contatoPrincipal: false },
        });
      }

      return tx.pessoaContato.create({
        data: {
          pessoaId,
          ...createPessoaContatoDto,
        },
      });
    });
  }
}