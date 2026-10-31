import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateParoquiaDto } from './dto/create-paroquia.dto.js';
import { UpdateParoquiaDto } from './dto/update-paroquia.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { DioceseService } from 'src/diocese/diocese.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { accessibleBy } from '@casl/prisma';
import { Paroquia } from 'neocatecumenal';
import { PAROQUIA_SELECT } from 'src/prisma/selects/paroquia.select.js';
import { Prisma } from 'src/prisma/generated-client.js';
import { SetorService } from 'src/mapa/setor/setor.service.js';
import { serializeParoquia } from './paroquia.serialize.js';
import { BaseService } from 'src/commons/base.service.js';
import { FindAllParoquiasQueryDto } from './dto/findAll-paroquia.dto.js';

@Injectable()
export class ParoquiaService extends BaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dioceseService: DioceseService,
    private readonly enderecoService: EnderecoService,
    private readonly setorService: SetorService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(createParoquiaDto: CreateParoquiaDto) {
    this.validateCreateAbility('paroquia');
    await this.dioceseService.findOne(createParoquiaDto.diocese.id);
    await this.setorService.findOne(createParoquiaDto.setor.id);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        return this.createParoquiaTransaction(createParoquiaDto, transaction);
      });

      return serializeParoquia(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        `Ocorreu um erro ao cadastrar a paroquia. Por favor tente novamente mais tarde. Erro: ${error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async findAll(query: FindAllParoquiasQueryDto): Promise<Paroquia[]> {
    this.validateReadAbility('paroquia');
    const dioceseId = query.dioceseId ? +query.dioceseId : undefined;
    const cidadeId = query.cidadeId ? +query.cidadeId : undefined;
    
    const permissionWhere = this.asPermissions();
    const where = {
      ...permissionWhere,
    };

    if (query.dioceseId) {
      where.dioceseId = dioceseId;
    }

    if (query.cidadeId) {
      where.endereco = {
        cidade: {
          id: cidadeId,
        }
      };
    }

    const results = await this.prisma.paroquia.findMany({
      where,
      select: PAROQUIA_SELECT,
    });

    return results.map((result) => serializeParoquia(result));
  }

  async findOne(id: number): Promise<Paroquia> {
    const wherePermissions = this.asPermissions();
    const paroquia = await this.prisma.paroquia.findFirstOrThrow({
      where: {
        AND: [{ id }, wherePermissions],
      },
      select: PAROQUIA_SELECT,
    });
    return serializeParoquia(paroquia);
  }

  async update(
    id: number,
    updateParoquiaDto: UpdateParoquiaDto,
  ): Promise<Paroquia> {
    this.validateUpdateAbility('paroquia');
    const paroquia = await this.findOne(id);
    if (!paroquia) {
      throw new NotFoundException('Paroquia não encontrada');
    }

    const diocese = await this.dioceseService.findOne(
      updateParoquiaDto.diocese.id,
    );
    if (!diocese) {
      throw new NotFoundException('Diocese não encontrada');
    }

    this.validarEnderecoPertenceParoquia(
      paroquia.endereco.id,
      updateParoquiaDto.endereco.id,
    );

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const endereco = await this.enderecoService.update(
          updateParoquiaDto.endereco.id,
          updateParoquiaDto.endereco,
          transaction,
        );

        return await transaction.paroquia.update({
          data: {
            descricao: updateParoquiaDto.descricao,
            enderecoId: endereco.id,
            dioceseId: updateParoquiaDto.diocese.id,
            ...(updateParoquiaDto.setor && {
              setorId: updateParoquiaDto.setor.id,
            }),
          },
          select: PAROQUIA_SELECT,
          where: {
            id,
          },
        });
      });

      return serializeParoquia(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        `Ocorreu um erro ao atualizar a paroquia. Por favor tente novamente mais tarde. Erro: ${error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async remove(id: number) {
    this.validateDeleteAbility('paroquia');

    const result = await this.prisma.$transaction(async (transaction) => {
      const paroquia = await transaction.paroquia.delete({
        where: { id },
        select: PAROQUIA_SELECT,
      });

      await transaction.endereco.delete({
        where: { id: paroquia.endereco.id },
      });

      return paroquia;
    });

    this.logger.log(`Paroquia id ${id} removida com sucesso`);
    return serializeParoquia(result);
  }

  private validarEnderecoPertenceParoquia(
    enderecoParoquia: number,
    enderecoPayload: number,
  ) {
    if (enderecoParoquia !== enderecoPayload) {
      throw new NotFoundException(
        `Endereço id ${enderecoPayload} não encontrada para essa paroquia.`,
      );
    }
  }

  private asPermissions() {
    this.validateReadAbility('paroquia');
    const { ability } = this.abilityService;
    return accessibleBy(ability, 'read').paroquia;
  }

  private async createParoquiaTransaction(
    createParoquiaDto: CreateParoquiaDto,
    transaction: Prisma.TransactionClient,
  ): Promise<Paroquia> {
    const endereco = await this.enderecoService.create(
      {
        ...createParoquiaDto.endereco,
        observacao: `End. da paróquia ${createParoquiaDto.descricao}.`,
      },
      transaction,
    );

    const paroquia = await transaction.paroquia.create({
      data: {
        descricao: createParoquiaDto.descricao,
        enderecoId: endereco.id,
        dioceseId: createParoquiaDto.diocese.id,
        setorId: createParoquiaDto.setor.id,
      },
      select: PAROQUIA_SELECT,
    });
    return serializeParoquia(paroquia);
  }
}
