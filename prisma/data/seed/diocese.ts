import { PrismaClient } from '../../../generated/client.js';

export async function seedDiocese(prisma: PrismaClient) {
  // -------------------------------------------------------
  // 0. Diocese de Palmas
  // -------------------------------------------------------
  const cidade = await prisma.cidade.findUnique({
    where: { nome: 'Palmas' },
  });

  const endereco = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '37830000',
      logradouro: 'Rua Francisco Ribeiro do Vale',
      numero: '242',
      observacao: 'Bispo: Dom Eduardo Zielski',
      cidadeId: cidade.id,
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Mitra Diocesana de Palmas',
      tipoDioceseId: 1,
      enderecoId: endereco.id,
    },
  });

  // -------------------------------------------------------
  // 1. Diocese de Santos
  // -------------------------------------------------------
  const cidadeSantos = await prisma.cidade.findUnique({
    where: { nome: 'Santos' },
  });
  const enderecoSantos = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '11015200',
      logradouro: 'Avenida Conselheiro Rodrigues Alves',
      numero: '254',
      observacao: 'Sede da Mitra Diocesana de Santos',
      cidadeId: cidadeSantos.id,
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Mitra Diocesana de Santos',
      tipoDioceseId: 1,
      enderecoId: enderecoSantos.id,
    },
  });

  // -------------------------------------------------------
  // 2. Diocese de Santo Amaro
  // -------------------------------------------------------
  const cidadeSaoPaulo = await prisma.cidade.findUnique({
    where: { nome: 'São Paulo' },
  });
  const enderecoSantoAmaro = await prisma.endereco.create({
    data: {
      bairro: 'Vila Mascote',
      cep: '04363001',
      logradouro: 'Avenida Mascote',
      numero: '1171',
      observacao: 'Sede da Mitra Diocesana de Santo Amaro',
      cidadeId: cidadeSaoPaulo.id, // São Paulo - SP
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Mitra Diocesana de Santo Amaro',
      tipoDioceseId: 1,
      enderecoId: enderecoSantoAmaro.id,
    },
  });

  // -------------------------------------------------------
  // 3. Diocese de Piracicaba
  // -------------------------------------------------------
  const cidadePiracicaba = await prisma.cidade.findUnique({
    where: { nome: 'Piracicaba' },
  });
  const enderecoPiracicaba = await prisma.endereco.create({
    data: {
      bairro: 'Higienópolis',
      cep: '13419155',
      logradouro: 'Avenida Independência',
      numero: '1146',
      observacao: 'Sede da Mitra Diocesana de Piracicaba',
      cidadeId: cidadePiracicaba.id, // Piracicaba - SP
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Mitra Diocesana de Piracicaba',
      tipoDioceseId: 1,
      enderecoId: enderecoPiracicaba.id,
    },
  });

  // -------------------------------------------------------
  // 4. Arquidiocese de Ribeirão Preto
  // -------------------------------------------------------
  const cidadeRibeiraoPreto = await prisma.cidade.findUnique({
    where: { nome: 'Ribeirão Preto' },
  });
  const enderecoRibeiraoPreto = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '14010090',
      logradouro: 'Rua Tibiriçá',
      numero: '879',
      observacao: 'Sede da Mitra Arquidiocesana de Ribeirão Preto',
      cidadeId: cidadeRibeiraoPreto.id, // Ribeirão Preto - SP
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Mitra Arquidiocesana de Ribeirão Preto',
      tipoDioceseId: 1,
      enderecoId: enderecoRibeiraoPreto.id,
    },
  });

  // -------------------------------------------------------
  // 5. Diocese de Franca
  // -------------------------------------------------------
  const cidadeFranca = await prisma.cidade.findUnique({
    where: { nome: 'Franca' },
  });
  const enderecoFranca = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '14400410',
      logradouro: 'Rua Saldanha Marinho',
      numero: '1903',
      observacao: 'Sede da Mitra Diocesana de Franca',
      cidadeId: cidadeFranca.id, // Franca - SP
    },
  });

  await prisma.diocese.create({
    data: {
      descricao: 'Sé Imaculada Conceição de Franca',
      tipoDioceseId: 2,
      enderecoId: enderecoFranca.id,
    },
  });

  console.log('---------------------------------');
  console.log('Diocese preenchido com sucesso!');
}
