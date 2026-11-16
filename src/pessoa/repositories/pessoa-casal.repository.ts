import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { Prisma } from 'src/prisma/generated-client.js';

@Injectable()
export class PessoaCasalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.pessoaCasalUncheckedCreateInput) {
    return this.prisma.pessoaCasal.create({ data });
  }

  findFirst(where: Prisma.pessoaCasalWhereInput) {
    return this.prisma.pessoaCasal.findFirst({ where });
  }
}