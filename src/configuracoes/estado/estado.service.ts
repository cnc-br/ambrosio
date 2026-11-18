import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateEstadoDto } from './dto/create-estado.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { PaisService } from '../pais/pais.service.js';

@Injectable()
export class EstadoService {
  private readonly logger = new Logger(EstadoService.name);

  constructor(
    private prisma: PrismaService,
    private paisService: PaisService,
  ) {}

  async createOrSelect(createEstadoDto: CreateEstadoDto, userId?: string) {
    const uf = await this.prisma.estado.findFirst({
      where: {
        sigla: createEstadoDto.sigla,
      },
    });

    if (uf) {
      this.logger.log(`Estado ${uf.nome} (${uf.sigla}) já existe cadastrado.`);
      return uf;
    }

    // TODO: Issue #42 = criar validacao se o estado realmente pertence ao pais.
    const pais = await this.paisService.findOne(createEstadoDto.pais.id);

    if (!pais) {
      throw new NotFoundException('Pais não encontrado');
    }

    return await this.prisma.estado.create({
      data: {
        nome: createEstadoDto.nome,
        sigla: createEstadoDto.sigla,
        paisId: pais.id,
        cadastradoPorId: userId ?? null,
        atualizadoPorId: userId ?? null,
      },
    });
  }

  findAll() {
    return this.prisma.estado.findMany({
      include: {
        pais: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.estado.findUniqueOrThrow({
      where: { id },
      include: {
        pais: true,
      },
    });
  }

  async findBySigla(sigla: string) {
    return await this.prisma.estado.findFirstOrThrow({
      where: { sigla },
    });
  }
}
