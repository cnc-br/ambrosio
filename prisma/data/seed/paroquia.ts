import { PrismaClient } from '../../../generated/client.js';

export async function seedParoquia(prisma: PrismaClient) {
  const cidadeFranca = await prisma.cidade.findUnique({
    where: { nome: 'Franca' },
  });

  // -------------------------------------------------------
  // 0. Paróquia Nossa Senhora Aparecida
  // -------------------------------------------------------
  const endereco0 = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '14400660',
      logradouro: 'Rua do comércio',
      numero: '789',
      observacao: 'Padre Ramon foi catequista aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Nossa Senhora Aparecida',
      dioceseId: 6,
      enderecoId: endereco0.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 1. Paróquia São Benedito
  // -------------------------------------------------------
  const endereco1 = await prisma.endereco.create({
    data: {
      bairro: 'Centro',
      cep: '14400070',
      logradouro: 'Rua General Telles',
      numero: '351',
      observacao: 'Padre João foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia São Benedito',
      dioceseId: 1,
      enderecoId: endereco1.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 2. Paróquia Nossa Senhora do Carmo
  // -------------------------------------------------------
  const endereco2 = await prisma.endereco.create({
    data: {
      bairro: 'Jardim Petráglia',
      cep: '14403000',
      logradouro: 'Rua Saldanha Marinho',
      numero: '2500',
      observacao: 'Padre Carlos foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Nossa Senhora do Carmo',
      dioceseId: 1,
      enderecoId: endereco2.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 3. Paróquia Santo Antônio
  // -------------------------------------------------------
  const endereco3 = await prisma.endereco.create({
    data: {
      bairro: 'Vila Santo Antônio',
      cep: '14404000',
      logradouro: 'Rua Major Claudiano',
      numero: '1800',
      observacao: 'Padre Maria foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Santo Antônio',
      dioceseId: 1,
      enderecoId: endereco3.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 4. Paróquia São Sebastião
  // -------------------------------------------------------
  const endereco4 = await prisma.endereco.create({
    data: {
      bairro: 'Cidade Nova',
      cep: '14401000',
      logradouro: 'Rua Comandante Salgado',
      numero: '1200',
      observacao: 'Padre João foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia São Sebastião',
      dioceseId: 1,
      enderecoId: endereco4.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 5. Paróquia Sagrado Coração de Jesus
  // -------------------------------------------------------
  const endereco5 = await prisma.endereco.create({
    data: {
      bairro: 'Jardim Francano',
      cep: '14405000',
      logradouro: 'Rua Voluntários da Franca',
      numero: '600',
      observacao: 'Padre Pedro foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Sagrado Coração de Jesus',
      dioceseId: 1,
      enderecoId: endereco5.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 6. Paróquia Santa Teresinha do Menino Jesus
  // -------------------------------------------------------
  const endereco6 = await prisma.endereco.create({
    data: {
      bairro: 'Vila Santa Teresinha',
      cep: '14402000',
      logradouro: 'Rua Padre Anchieta',
      numero: '450',
      observacao: 'Algumas comunidades se reúnem aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Santa Teresinha do Menino Jesus',
      dioceseId: 1,
      enderecoId: endereco6.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 7. Paróquia São José
  // -------------------------------------------------------
  const endereco7 = await prisma.endereco.create({
    data: {
      bairro: 'Vila São José',
      cep: '14406000',
      logradouro: 'Rua São José',
      numero: '320',
      observacao: 'Padre João foi cura aqui',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia São José',
      dioceseId: 1,
      enderecoId: endereco7.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 8. Paróquia Imaculada Conceição
  // -------------------------------------------------------
  const endereco8 = await prisma.endereco.create({
    data: {
      bairro: 'Jardim Consolação',
      cep: '14407000',
      logradouro: 'Rua Monsenhor Rosa',
      numero: '980',
      observacao: '',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Imaculada Conceição',
      dioceseId: 1,
      enderecoId: endereco8.id,
      setorId: 1,
    },
  });

  // -------------------------------------------------------
  // 9. Paróquia Cristo Rei
  // -------------------------------------------------------
  const endereco9 = await prisma.endereco.create({
    data: {
      bairro: 'Jardim Cristo Rei',
      cep: '14408000',
      logradouro: 'Rua Ouvidor Freire',
      numero: '150',
      observacao: '',
      cidadeId: cidadeFranca.id,
    },
  });

  await prisma.paroquia.create({
    data: {
      descricao: 'Paróquia Cristo Rei',
      dioceseId: 1,
      enderecoId: endereco9.id,
      setorId: 1,
    },
  });

  console.log('---------------------------------');
  console.log('Paróquias preenchidas com sucesso!');
}
