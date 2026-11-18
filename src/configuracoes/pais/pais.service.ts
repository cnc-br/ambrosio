import { HttpException, Injectable, Logger } from '@nestjs/common';
import { CreatePaisDto } from './dto/create-pais.dto.js';
import { UpdatePaisDto } from './dto/update-pais.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { HttpService } from '@nestjs/axios';
import { Prisma } from 'src/prisma/generated-client.js';
import { UNIQUE_CONSTRAINT_FAILED } from 'src/commons/constants/constants.js';


@Injectable()
export class PaisService {
  private readonly logger = new Logger(PaisService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
  ) { }

  async create(createPaisDto: CreatePaisDto, userId?: string) {
    try {
      return await this.prisma.pais.create({
        data: {
          nome: createPaisDto.nome,
          cadastradoPorId: userId ?? null,
          atualizadoPorId: userId ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_FAILED
      ) {
        this.logger.log(
          `Pais ${createPaisDto.nome} ja existe cadastrado no banco de dados.`,
        );
        return await this.findByName(createPaisDto.nome);
      } else {
        this.logger.error(error);
        throw new HttpException('Erro ao cadastrar pais', 500);
      }
    }
  }

  findAll() {
    return this.prisma.pais.findMany();
  }

  findOne(id: number) {
    return this.prisma.pais.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: number, updatePaisDto: UpdatePaisDto) {
    return this.prisma.pais.update({
      where: { id },
      data: updatePaisDto,
    });
  }

  remove(id: number) {
    return this.prisma.pais.delete({
      where: { id },
    });
  }

  private findByName(nome: string) {
    return this.prisma.pais.findFirstOrThrow({
      where: { nome },
    });
  }
}