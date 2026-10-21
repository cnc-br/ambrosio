import { Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { UpdateComunidadeDto } from './dto/update-comunidade.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ParoquiaService } from 'src/paroquia/paroquia.service.js';
import { Comunidade } from 'neocatecumenal';
import { Prisma } from 'src/prisma/generated-client.js';
import { HistoricoService } from './historico/historico.service.js';
import { ENDERECO_INCLUDE } from 'src/prisma/includes.js';
import serializeComunidadeResponse from './comunidade.serialize.js';
import { CreateComunidadeDto } from './dto/create-comunidade.dto.js';

@Injectable()
export class ComunidadeService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly paroquiaService: ParoquiaService,
    private readonly historicoService: HistoricoService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(createComunidadeDto: CreateComunidadeDto) {
    this.validateCreateAbility('comunidade');

    const paroquia = await this.paroquiaService.findOne(
      createComunidadeDto.paroquiaId,
    );

    const comunidade = await this.prisma.comunidade.create({
      data: {
        numeroDaComunidade: createComunidadeDto.numeroDaComunidade,
        quantidadeMembros: createComunidadeDto.quantidadeMembros,
        paroquiaId: paroquia.id,
        observacao: createComunidadeDto.observacao,
      },
    });

    try {
      await this.historicoService.create({
        comunidadeId: comunidade.id,
        numeroComunidade: comunidade.numeroDaComunidade,
        descricao: `Comunidade ${comunidade.numeroDaComunidade} cadastrada no sistema.`,
      });
    } catch (error) {
      await this.remove(comunidade.id);
      this.logger.error(
        `Erro ao criar historico para comunidade ${comunidade.numeroDaComunidade} - (ID: ${comunidade.id}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return await this.findOne(comunidade.id);
  }

  async findAll(paroquiaId?: number, numeroDaComunidade?: number) {
    this.validateReadAbility('comunidade');
    const where: Prisma.comunidadeWhereInput = {
      AND: [
        accessibleBy(this.abilityService.ability, 'read').comunidade,
        {
          ...(paroquiaId != null && { paroquiaId }),
          ...(numeroDaComunidade != null && { numeroDaComunidade }),
        },
      ],
    };

    const comunidades = await this.prisma.comunidade.findMany({
      where,
      include: {
        paroquia: {
          include: {
            endereco: ENDERECO_INCLUDE,
            diocese: {
              include: {
                tipoDiocese: true,
                endereco: ENDERECO_INCLUDE,
              },
            },
          },
        },
        etapa: true,
        comunidadeEtapas: {
          include: {
            etapa: true,
          },
        },
      },
      orderBy: { numeroDaComunidade: 'asc' },
    });
    return comunidades.map(serializeComunidadeResponse);
  }

  async findByPessoaId(pessoaId: number): Promise<number | null> {
    this.validateReadAbility('comunidade');
    const comunidades = await this.prisma.comunidade.findMany({
      where: {
        comunidadePessoas: {
          some: {
            pessoaId,
          },
        },
      },
    });
    return comunidades.length > 0 ? comunidades[0].id : null;
  }

  async findOne(id: number): Promise<Comunidade> {
    this.validateReadAbility('comunidade');
    const comunidade = await this.prisma.comunidade.findFirstOrThrow({
      where: { id },
      include: {
        etapa: true,
        comunidadeEtapas: {
          include: {
            etapa: true,
            equipe: true,
          },
        },
        paroquia: {
          include: {
            diocese: {
              include: {
                tipoDiocese: true,
                endereco: ENDERECO_INCLUDE,
              },
            },
          },
        },
      },
    });
    return serializeComunidadeResponse(comunidade);
  }

  async update(id: number, updateComunidadeDto: UpdateComunidadeDto) {
    this.validateUpdateAbility('comunidade');

    await this.historicoService.create({
      comunidadeId: id,
      numeroComunidade: updateComunidadeDto.numeroDaComunidade,
      descricao: `Comunidade com ${updateComunidadeDto.quantidadeMembros} membros.`,
    });

    return this.prisma.comunidade.update({
      where: { id },
      data: {
        numeroDaComunidade: updateComunidadeDto.numeroDaComunidade,
        quantidadeMembros: updateComunidadeDto.quantidadeMembros,
        observacao: updateComunidadeDto.observacao,
        etapaAtualId: updateComunidadeDto.etapaAtualId,
      },
    });
  }

  remove(id: number) {
    this.validateDeleteAbility('comunidade');
    this.logger.log(`Removendo comunidade de id ${id}`);
    return this.prisma.comunidade.delete({
      where: { id },
    });
  }

  adicionarPessoa(comunidadeId: number, pessoaId: number) {
    this.validateUpdateAbility('comunidade');
    return this.prisma.comunidadePessoa.create({
      data: {
        dataEntrada: new Date(),
        comunidadeId,
        pessoaId,
      },
    });
  }

  removerPessoa(comunidadeId: number, pessoaId: number) {
    this.validateUpdateAbility('comunidade');
    return this.prisma.comunidadePessoa.delete({
      where: {
        comunidadeId_pessoaId: {
          comunidadeId,
          pessoaId,
        },
      },
    });
  }
}
