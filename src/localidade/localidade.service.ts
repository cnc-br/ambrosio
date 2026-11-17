import { Injectable, Logger } from '@nestjs/common';
import { CreateLocalidadeDto } from './dto/create-localidade.dto.js';
import { UpdateLocalidadeDto } from './dto/update-localidade.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { EnderecoService } from 'src/endereco/endereco.service.js';

@Injectable()
export class LocalidadeService {
  private readonly logger = new Logger(LocalidadeService.name);

  constructor(
    private prisma: PrismaService,
    private enderecoService: EnderecoService,
  ) {}

  async create(createLocalidadeDto: CreateLocalidadeDto, userId?: string) {
    const endereco = await this.enderecoService.create(
      createLocalidadeDto.endereco,
      undefined,
      userId,
    );

    try {
      const localidade = await this.prisma.localidade.create({
        data: {
          descricao: createLocalidadeDto.descricao,
          dioceseId: createLocalidadeDto.diocese.id,
          tipoLocalidadeId: createLocalidadeDto.tipoLocalidade.id,
          observacao: createLocalidadeDto.observacao,
          enderecoId: endereco.id,
          cadastradoPorId: userId ?? null,
          atualizadoPorId: userId ?? null,
        },
      });

      return localidade;
    } catch (err) {
      this.logger.error(err);
      await this.enderecoService.remove(endereco.id);
    }
  }

  findAll() {
    return this.prisma.localidade.findMany({
      include: {
        tipoLocalidade: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.localidade.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        tipoLocalidade: true,
      },
    });
  }

  update(id: number, updateLocalidadeDto: UpdateLocalidadeDto) {
    return `This action updates a #${id} localidade ${updateLocalidadeDto.descricao}}`;
  }

  remove(id: number) {
    return `This action removes a #${id} localidade`;
  }
}
