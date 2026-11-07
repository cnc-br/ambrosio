import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { CreateAvisoDto } from './dto/create-aviso.dto.js';
import { UpdateAvisoDto } from './dto/update-aviso.dto.js';

@Injectable()
export class AvisosService {
  constructor(private prisma: PrismaService) {}

  create(createAvisoDto: CreateAvisoDto) {
    return this.prisma.aviso.create({
      data: {
        texto: createAvisoDto.texto,
        dataFim: createAvisoDto.dataFim,
      },
    });
  }

  findAll() {
    return this.prisma.aviso.findMany({
      orderBy: { dataFim: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.aviso.findUniqueOrThrow({
      where: { id },
    });
  }

  update(id: number, updateAvisoDto: UpdateAvisoDto) {
    return this.prisma.aviso.update({
      where: { id },
      data: updateAvisoDto,
    });
  }
}
