import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCidadeDto } from './dto/create-cidade.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { EstadoService } from '../estado/estado.service.js';
import { SELECT_CIDADE } from 'src/prisma/selects/endereco.select.js';

@Injectable()
export class CidadeService {
  private readonly logger = new Logger(CidadeService.name);

  constructor(
    private prisma: PrismaService,
    private estadoService: EstadoService,
  ) {}

  async createOrSelect(createCidadeDto: CreateCidadeDto, userId?: string) {
    const cidade = await this.findByName(createCidadeDto.nome);

    if (cidade) {
      this.logger.log(
        `Cidade ${createCidadeDto.nome} - ${createCidadeDto.estado.sigla} ja existe cadastrado.`,
      );
      return cidade;
    }

    const uf = await this.estadoService.findBySigla(
      createCidadeDto.estado.sigla,
    );

    if (!uf) {
      throw new NotFoundException('Estado não encontrado');
    }

    return this.prisma.cidade.create({
      data: {
        nome: createCidadeDto.nome,
        estadoId: uf.id,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.cidade.findMany({
      select: SELECT_CIDADE,
    });
  }

  findOne(id: number) {
    return this.prisma.cidade.findUniqueOrThrow({
      where: { id },
      select: SELECT_CIDADE,
    });
  }

  private async findByName(nome: string) {
    return await this.prisma.cidade.findFirst({
      where: { nome },
    });
  }
}
