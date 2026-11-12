import { Injectable, HttpException, BadRequestException } from '@nestjs/common';
import { CreateCarismaDto } from './dto/create-carisma.dto.js';
import { UpdateCarismaDto } from './dto/update-carisma.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { CARISMA_IDS_ENUM, TIPO_CARISMA_ENUM } from 'src/commons/enums/enums.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { CreateCarismaDaPessoaDto } from './dto/create-carisma-da-pessoa.dto.js';
import { Pessoa } from 'neocatecumenal';

@Injectable()
export class CarismaService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pessoaService: PessoaService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  create(createCarismaDto: CreateCarismaDto) {
    this.validateCreateAbility('carisma');

    return this.prisma.carisma.create({
      data: {
        descricao: createCarismaDto.descricao,
        tipo: createCarismaDto.tipo as TIPO_CARISMA_ENUM,
        casalAndaJunto: createCarismaDto.casalAndaJunto || false,
      },
    });
  }

  async addCarismaToPessoa(
    pessoaId: number,
    carismaDto: CreateCarismaDaPessoaDto,
  ) {
    // Validações
    if (!pessoaId || pessoaId <= 0) {
      throw new BadRequestException('ID da pessoa inválido');
    }

    if (!carismaDto.carismaIds || carismaDto.carismaIds.length === 0) {
      throw new BadRequestException('Nenhum carisma fornecido');
    }

    // Valida permissão e escopo de paróquia antes de qualquer escrita
    this.validateUpdateAbility('pessoa');
    await this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(pessoaId);

    // Remove IDs duplicados
    const uniqueCarismaIds = [...new Set(carismaDto.carismaIds)];

    try {
      // Verifica se todos os carismas fornecidos existem
      const carismas = await this.prisma.carisma.findMany({
        where: { id: { in: uniqueCarismaIds } },
      });

      if (carismas.length !== uniqueCarismaIds.length) {
        const foundIds = carismas.map((c) => c.id);
        const notFoundIds = uniqueCarismaIds.filter(
          (id) => !foundIds.includes(id),
        );

        throw new HttpException(
          `Carismas com IDs ${notFoundIds.join(', ')} não encontrados`,
          404,
        );
      }

      // Busca os carismas atualmente vinculados à pessoa
      const currentCarismas = await this.prisma.pessoaCarisma.findMany({
        where: { pessoaId },
        select: { carismaId: true },
      });

      const currentCarismaIds = currentCarismas.map((c) => c.carismaId);

      // Identifica carismas a remover (estão atualmente mas não estão no novo array)
      const carismasToRemove = currentCarismaIds.filter(
        (id) => !uniqueCarismaIds.includes(id),
      );

      // Identifica carismas a adicionar (estão no novo array mas não estão atualmente)
      const carismasToAdd = uniqueCarismaIds.filter(
        (id) => !currentCarismaIds.includes(id),
      );

      // Remove carismas que não constam no novo array
      if (carismasToRemove.length > 0) {
        await this.removeCarismaFromPessoa(pessoaId, carismasToRemove);
      }

      // Adiciona novos carismas
      if (carismasToAdd.length > 0) {
        const resultAdd = await this.prisma.pessoaCarisma.createMany({
          data: carismasToAdd.map((carismaId) => ({
            pessoaId,
            carismaId,
            observacao: carismaDto.observacao?.trim() || null,
          })),
          skipDuplicates: true,
        });

        this.logger.log(
          `${resultAdd.count} carisma(s) adicionado(s) à pessoa ID ${pessoaId}`,
        );
      } else {
        this.logger.log(
          `Nenhum novo carisma para adicionar à pessoa ID ${pessoaId}`,
        );
      }

      // Retorna o resumo da operação
      return {
        pessoaId,
        adicionados: carismasToAdd.length,
        removidos: carismasToRemove.length,
        mantidos: uniqueCarismaIds.filter((id) =>
          currentCarismaIds.includes(id),
        ).length,
        carismasFinais: uniqueCarismaIds,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar carismas da pessoa ${pessoaId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  private async removeCarismaFromPessoa(
    pessoaId: number,
    carismaIds: number[],
  ) {
    if (!pessoaId || pessoaId <= 0) {
      throw new BadRequestException('ID da pessoa inválido');
    }

    if (!carismaIds || carismaIds.length === 0) {
      throw new BadRequestException('Nenhum carisma fornecido');
    }

    const uniqueCarismaIds = [...new Set(carismaIds)];

    try {
      const result = await this.prisma.pessoaCarisma.deleteMany({
        where: {
          pessoaId,
          carismaId: { in: uniqueCarismaIds },
        },
      });

      if (result.count === 0) {
        this.logger.warn(
          `Nenhum carisma encontrado para remover da pessoa ID ${pessoaId}`,
        );
        return result;
      }

      this.logger.log(
        `${result.count} carisma(s) removido(s) da pessoa ID ${pessoaId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao remover carismas da pessoa ${pessoaId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async findAllPessoaComCarismaParaEquipe() {
    // IDs dos carismas que formam a equipe especializada
    const carismaId = [
      CARISMA_IDS_ENUM.CATEQUISTA,
      CARISMA_IDS_ENUM.FAMILIA_MISSAO,
      CARISMA_IDS_ENUM.FAMILIA_ITINERANTE,
      CARISMA_IDS_ENUM.POS_CRISMA,
    ];

    try {
      const pessoasCarisma = await this.prisma.pessoaCarisma.findMany({
        where: { carismaId: { in: carismaId } },
        include: {
          carisma: true,
          pessoa: true,
        },
      });

      const result = await Promise.all(
        pessoasCarisma.map(async (pc) => {
          const pessoaDetails: Pessoa = await this.pessoaService.findOne(
            pc.pessoa.id,
          );

          return {
            id: pc.id,
            pessoa: {
              id: pc.pessoa.id,
              nome: pessoaDetails.nome,
              casal: pessoaDetails.conjugue ? true : false,
            },
            carisma: {
              id: pc.carismaId,
              descricao: pc.carisma.descricao,
              tipo: pc.carisma.tipo,
            },
            paroquia: 'Pendente de implementação do TI', // TODO: adicionar paróquia que vai aparecer na comunidade da pessoa
          };
        }),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pessoas do carisma ${carismaId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  async getCarismasByPessoa(pessoaId: number) {
    if (!pessoaId || pessoaId <= 0) {
      throw new BadRequestException('ID da pessoa inválido');
    }

    try {
      const carismas = await this.prisma.pessoaCarisma.findMany({
        where: { pessoaId },
        include: {
          carisma: true,
        },
        orderBy: {
          carisma: {
            descricao: 'asc',
          },
        },
      });

      return carismas;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar carismas da pessoa ${pessoaId}:`,
        (error as Error).message,
      );
      throw error;
    }
  }

  findAll() {
    this.validateReadAbility('carisma');
    return this.prisma.carisma.findMany({
      select: {
        id: true,
        descricao: true,
        tipo: true,
        casalAndaJunto: true,
      },
      orderBy: {
        descricao: 'asc',
      },
    });
  }

  findOne(id: number) {
    this.validateReadAbility('carisma');

    if (!id || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    return this.prisma.carisma.findUnique({
      where: { id },
    });
  }

  update(id: number, updateCarismaDto: UpdateCarismaDto) {
    this.validateUpdateAbility('carisma');

    if (!id || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    return this.prisma.carisma.update({
      where: { id },
      data: {
        descricao: updateCarismaDto.descricao,
        tipo: updateCarismaDto.tipo as TIPO_CARISMA_ENUM,
        casalAndaJunto: updateCarismaDto.casalAndaJunto,
      },
    });
  }

  async remove(id: number) {
    this.validateDeleteAbility('carisma');

    if (!id || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    try {
      // Remove todas as relações antes de remover o carisma
      await this.prisma.pessoaCarisma.deleteMany({
        where: { carismaId: id },
      });

      const result = await this.prisma.carisma.delete({
        where: { id },
      });

      this.logger.log(`Carisma ID ${id} removido com sucesso`);
      return result;
    } catch (error) {
      this.logger.error(`Erro ao remover carisma ${id}:`, (error as Error).message);
      throw error;
    }
  }
}
