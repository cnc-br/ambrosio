import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDioceseDto } from './dto/create-diocese.dto.js';
import { UpdateDioceseDto } from './dto/update-diocese.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { accessibleBy } from '@casl/prisma';
import { EnderecoService } from 'src/endereco/endereco.service.js';
import { TipoDioceseService } from 'src/configuracoes/tipo-diocese/tipo-diocese.service.js';
import { Diocese } from 'neocatecumenal';
import { serializeEndereco } from 'src/commons/utils/serializers/serializerEndereco.js';
import { DIOCESE_SELECT } from 'src/prisma/selects/diocese.select.js';
import { BaseService } from 'src/commons/base.service.js';
import { ENDERECO_INCLUDE } from 'src/prisma/includes.js';

@Injectable()
export class DioceseService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private enderecoService: EnderecoService,
    private readonly tipoDioceseService: TipoDioceseService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(
    createDioceseDto: CreateDioceseDto,
    userId?: string,
  ): Promise<Diocese> {
    this.validateCreateAbility('diocese');
    await this.tipoDioceseService.findOne(createDioceseDto.tipoDiocese.id);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const endereco = await this.enderecoService.create(
          {
            ...createDioceseDto.endereco,
            observacao: `End. de ${createDioceseDto.tipoDiocese.descricao} ${createDioceseDto.descricao}. ${createDioceseDto.observacao || ''}`,
          },
          transaction,
          userId,
        );

        return await transaction.diocese.create({
          data: {
            descricao: createDioceseDto.descricao,
            tipoDioceseId: createDioceseDto.tipoDiocese.id,
            enderecoId: endereco.id,
            cadastradoPorId: userId ?? null,
            atualizadoPorId: userId ?? null,
          },
          select: DIOCESE_SELECT,
        });
      });

      return this.serializeResponse(result);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        `Ocorreu um erro ao cadastrar a diocese ${createDioceseDto.descricao}. Erro: ${error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async findAll(): Promise<Diocese[]> {
    const where = this.asPermissionsRead();
    const results = await this.prisma.diocese.findMany({
      where,
      select: DIOCESE_SELECT,
    });

    return results.map((result) => this.serializeResponse(result));
  }

  async findOne(id: number): Promise<Diocese> {
    const wherePermissions = this.asPermissionsRead();
    const diocese = await this.prisma.diocese.findFirstOrThrow({
      where: {
        AND: [{ id }, wherePermissions],
      },
      select: DIOCESE_SELECT,
    });

    return this.serializeResponse(diocese);
  }

  async update(
    id: number,
    updateDioceseDto: UpdateDioceseDto,
    userId?: string,
  ): Promise<Diocese> {
    this.validateUpdateAbility('diocese');

    const diocese = await this.findOne(id);
    let tipoDioceseId = diocese.tipoDiocese.id;

    if (updateDioceseDto.tipoDiocese) {
      await this.tipoDioceseService.findOne(updateDioceseDto.tipoDiocese.id);
      tipoDioceseId = updateDioceseDto.tipoDiocese.id;
    }

    this.validarEnderecoPertenceDiocese(
      diocese.endereco.id,
      updateDioceseDto.endereco.id,
    );

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const endereco = await this.enderecoService.update(
          updateDioceseDto.endereco.id,
          updateDioceseDto.endereco,
          transaction,
          userId,
        );

        return await transaction.diocese.update({
          data: {
            descricao: updateDioceseDto.descricao,
            tipoDioceseId,
            enderecoId: endereco.id,
            ...(userId ? { atualizadoPorId: userId } : {}),
          },
          include: {
            endereco: ENDERECO_INCLUDE,
            tipoDiocese: true,
          },
          where: {
            id,
          },
        });
      });

      return this.serializeResponse(result);
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new HttpException(
        `Ocorreu um erro ao editar a diocese ${updateDioceseDto.descricao}. Erro: ${error}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} diocese`;
  }

  private asPermissionsRead() {
    const { ability } = this.abilityService;
    if (!ability.can('read', 'diocese')) {
      throw new ForbiddenException(
        'Você não tem permissão para listar dioceses',
      );
    }
    return accessibleBy(ability, 'read').diocese;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private serializeResponse(diocese: any): Diocese {
    return {
      id: diocese.id,
      descricao: diocese.descricao,
      tipoDiocese: {
        id: diocese.tipoDiocese.id,
        descricao: diocese.tipoDiocese.descricao,
      },
      endereco: serializeEndereco(diocese.endereco),
    };
  }

  private validarEnderecoPertenceDiocese(
    enderecoDiocese: number,
    enderecoPayload: number,
  ) {
    if (enderecoDiocese !== enderecoPayload) {
      throw new NotFoundException(
        `Endereço id ${enderecoPayload} não encontrada para essa diocese`,
      );
    }
  }
}
