import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service.js';
import { Prisma } from 'src/prisma/generated-client.js';
import {
  PESSOA_BASICA_SELECT,
  PESSOA_DETALHE_INCLUDE,
  PESSOA_LISTAGEM_INCLUDE,
} from './pessoa.includes.js';

@Injectable()
export class PessoaRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.pessoaUncheckedCreateInput) {
    return this.prisma.pessoa.create({ data });
  }

  async deletePorId(id: number): Promise<void> {
    await this.prisma.pessoa.delete({ where: { id } });
  }

  findManyParaListagem({
    where,
    skip,
    take,
  }: {
    where: Prisma.pessoaWhereInput;
    skip: number;
    take: number;
  }) {
    return this.prisma.pessoa.findMany({
      skip,
      take,
      where,
      include: PESSOA_LISTAGEM_INCLUDE,
      orderBy: {
        id: 'desc',
      },
    });
  }

  findDetalhadoOrThrow(where: Prisma.pessoaWhereUniqueInput) {
    return this.prisma.pessoa.findUniqueOrThrow({
      where,
      include: PESSOA_DETALHE_INCLUDE,
    });
  }

  findUniquePorExternalId(externalId: string) {
    return this.prisma.pessoa.findUnique({
      where: { externalId },
    });
  }

  findBasicoPorIdOrThrow(id: number) {
    return this.prisma.pessoa.findUniqueOrThrow({
      select: PESSOA_BASICA_SELECT,
      where: { id },
    });
  }

  findNoEscopo(id: number, escopo: Prisma.pessoaWhereInput) {
    return this.prisma.pessoa.findFirst({
      where: { AND: [{ id }, escopo] },
    });
  }

  findUniqueOrThrowPorId(id: number) {
    return this.prisma.pessoa.findUniqueOrThrow({
      where: { id },
    });
  }

  findManyElegiveisCasal({ where }: { where: Prisma.pessoaWhereInput }) {
    return this.prisma.pessoa.findMany({
      select: PESSOA_BASICA_SELECT,
      where,
    });
  }

  updatePorId(id: number, data: Prisma.pessoaUncheckedUpdateInput) {
    return this.prisma.pessoa.update({
      where: { id },
      data,
    });
  }
}