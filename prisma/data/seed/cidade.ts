import { PrismaClient } from '../../../generated/client.js';

export async function seedCidade(prisma: PrismaClient) {
  const estadoMG = await prisma.estado.findUnique({ where: { sigla: 'MG' } });
  const estadoSP = await prisma.estado.findUnique({ where: { sigla: 'SP' } });
  const estadoTO = await prisma.estado.findUnique({ where: { sigla: 'TO' } });

  await prisma.cidade.create({
    data: {
      nome: 'Ibiraci',
      estadoId: estadoMG.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Guaxupé',
      estadoId: estadoMG.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Claraval',
      estadoId: estadoMG.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Cássia',
      estadoId: estadoMG.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Belo Horizonte',
      estadoId: estadoMG.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Ribeirão Preto',
      estadoId: estadoSP.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Santos',
      estadoId: estadoSP.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Franca',
      estadoId: estadoSP.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Piracicaba',
      estadoId: estadoSP.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'São Paulo',
      estadoId: estadoSP.id,
    },
  });

  await prisma.cidade.create({
    data: {
      nome: 'Palmas',
      estadoId: estadoTO.id,
    },
  });

  console.log('---------------------------------');
  console.log('Cidades preenchidas com sucesso!');
}
