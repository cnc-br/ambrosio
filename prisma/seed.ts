import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { PrismaClient, Sexo, tipoCarismaEnum } from '../generated/client.js';
import { seedCidade } from './data/seed/cidade.js';
import { seedDiocese } from './data/seed/diocese.js';
import { seedParoquia } from './data/seed/paroquia.js';
import { seedComunidade } from './data/seed/comunidade.js';

const schema = process.env.DB_SCHEMA ?? 'ambrosio';

const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL },
  schema ? { schema } : {},
);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Atencao: não alterar a ordem de execução das funções abaixo, pois algumas dependem de outras para serem executadas corretamente
  await pais();
  await estado();
  await cidade();
  await macroRegiao();
  await regiao();
  await setor();
  await estadoCivil();
  await escolaridade();
  await situacaoReligiosa();
  await carismas();
  await tipoDiocese();
  await tipoLocalidade();
  await tipoEquipe();
  await etapa();
  await diocese();
  await paroquia();
  await comunidade();
  await admin();
  await pessoas();

  async function admin() {
    await prisma.user.create({
      data: {
        email: 'admin@admin.com.br',
        password:
          '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC',
        role: 'ADMIN',
        whatsapp: '16999739999',
        active: true,
      },
    });

    await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password:
          '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC',
        role: 'ADMIN',
        whatsapp: '16999739999',
        active: true,
      },
    });

    await prisma.user.create({
      data: {
        email: 'ronaldinho@admin.com',
        password:
          '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC',
        role: 'NAO_IDENTIFICADO',
        whatsapp: '16999139999',
        active: true,
      },
    });

    const secretariaCnc = await prisma.user.create({
      data: {
        email: 'secretaria@admin.com',
        password:
          '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC',
        role: 'SECRETARIA_CNC',
        whatsapp: '16999239999',
        active: true,
      },
    });

    const primeiraParoquia = await prisma.paroquia.findFirstOrThrow({
      orderBy: { id: 'asc' },
    });

    await prisma.usuarioParoquia.create({
      data: {
        userId: secretariaCnc.id,
        paroquiaId: primeiraParoquia.id,
      },
    });

    console.log('---------------------------------');
    console.log('Usuario padrao preenchido com sucesso!');
  }

  async function tipoLocalidade() {
    const tiposLocalidades = [
      'Centro Neocatecumenal',
      'Seminário',
      'Convento',
      'Casa de Convivência',
      'Prelazia',
    ];

    for (const tipo of tiposLocalidades) {
      await prisma.tipoLocalidade.create({
        data: {
          descricao: tipo,
        },
      });
    }

    console.log('---------------------------------');
    console.log('Tipo localidade preenchidas com sucesso!');
  }

  async function situacaoReligiosa() {
    const situacaoReligiosas = [
      { descricao: 'Leigo', sexoUnico: null },
      { descricao: 'Seminarista', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Religioso(a)', sexoUnico: null },
      { descricao: 'Diácono', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Presbítero', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Bispo', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Arcebispo', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Cardeal', sexoUnico: Sexo.MASCULINO },
      { descricao: 'Papa', sexoUnico: Sexo.MASCULINO },
    ];

    for (const situacao of situacaoReligiosas) {
      await prisma.situacaoReligiosa.create({
        data: {
          descricao: situacao.descricao,
          sexoUnico: situacao.sexoUnico || null,
        },
      });
    }

    console.log('---------------------------------');
    console.log('Situação Religiosa preenchidas com sucesso!');
  }

  async function etapa() {
    const etapas = [
      'Pré Catecumenato',
      '1º Escrutinio',
      'Shemá',
      '2º Escrutinio Aberto',
      '2º Escrutinio',
      'Iniciação a Oração',
      'Traditio',
      'Retraditio',
      'Redditio',
      'Pai Nosso - 1ª Parte',
      'Pai Nosso - 2ª Parte',
      'Pai Nosso - 3ª Parte',
      'Eleição - 1ª Parte',
      'Eleição - 2ª Parte',
      'Renovação das Promessas Batismais',
      'Educação Permanente na Fé',
      'Peregrinação à Terra Santa',
      'Matrimônio Espiritual',
    ];

    for (const descricao of etapas) {
      await prisma.etapa.create({
        data: { descricao },
      });
    }

    console.log('---------------------------------');
    console.log('Etapas preenchidas com sucesso!');
  }

  async function pais() {
    await prisma.pais.create({
      data: {
        nome: 'Brasil',
      },
    });

    await prisma.pais.create({
      data: {
        nome: 'Peru',
      },
    });

    console.log('---------------------------------');
    console.log('Paises preenchido com sucesso!');
  }

  async function estado() {
    const paisId = (await prisma.pais.findFirst({ where: { nome: 'Brasil' } }))
      .id;
    await prisma.estado.create({
      data: {
        nome: 'Minas Gerais',
        sigla: 'MG',
        paisId,
      },
    });

    await prisma.estado.create({
      data: {
        nome: 'Tocantins',
        sigla: 'TO',
        paisId,
      },
    });

    await prisma.estado.create({
      data: {
        nome: 'São Paulo',
        sigla: 'SP',
        paisId,
      },
    });

    await prisma.estado.create({
      data: {
        nome: 'Goiás',
        sigla: 'GO',
        paisId,
      },
    });

    console.log('---------------------------------');
    console.log('Estados (UF) preenchido com sucesso!');
  }

  async function macroRegiao() {
    const macrosRegiao = ['Franca', 'Brasília', 'Goiás'];

    for (const macro of macrosRegiao) {
      await prisma.macroRegiao.create({
        data: {
          descricao: macro,
        },
      });
    }

    console.log('---------------------------------');
    console.log('Macro Regiões preenchidas com sucesso!');
  }

  async function regiao() {
    await prisma.regiao.create({
      data: { descricao: 'Franca', macroRegiaoId: 1 },
    });

    await prisma.regiao.create({
      data: { descricao: 'Ceará', macroRegiaoId: 2 },
    });

    await prisma.regiao.create({
      data: { descricao: 'Piauí', macroRegiaoId: 3 },
    });

    await prisma.regiao.create({
      data: { descricao: 'Campo Limpo', macroRegiaoId: 1 },
    });

    console.log('---------------------------------');
    console.log('Regiões preenchidas com sucesso!');
  }

  async function setor() {
    const setores = [
      {
        regiaoId: 1,
        descricao: 'Anhaguera - Setor 1',
      },
      {
        regiaoId: 1,
        descricao: 'Anhaguera - Setor 2',
      },
      {
        regiaoId: 1,
        descricao: 'Portinari - Setor 1',
      },
      {
        regiaoId: 1,
        descricao: 'Portinari - Setor 2',
      },
      {
        regiaoId: 2,
        descricao: 'Brasilia - Setor 1',
      },
      {
        regiaoId: 2,
        descricao: 'Brasilia - Setor 2',
      },
      {
        regiaoId: 2,
        descricao: 'Brasilia - Setor 3',
      },
      {
        regiaoId: 2,
        descricao: 'Brasilia - Setor 4',
      },
      {
        regiaoId: 2,
        descricao: 'Brasilia - Setor 5',
      },
      {
        regiaoId: 3,
        descricao: 'Centro Oeste - GO 1',
      },
      {
        regiaoId: 3,
        descricao: 'Centro Oeste - GO 2',
      },
      {
        regiaoId: 3,
        descricao: 'Centro Oeste - GO 3',
      },
    ];

    for (const setor of setores) {
      await prisma.setor.create({
        data: {
          descricao: setor.descricao,
          regiaoId: setor.regiaoId,
        },
      });
    }

    console.log('---------------------------------');
    console.log('Setores preenchidos com sucesso!');
  }

  async function cidade() {
    await seedCidade(prisma);
  }

  async function carismas() {
    const carismas = [
      { descricao: 'Vocacionado(a)', tipo: 'PRIMITIVO' },
      { descricao: 'Religioso(a)', tipo: 'PRIMITIVO' },
      { descricao: 'Familia em Missão', tipo: 'PRIMITIVO' },
      {
        descricao: 'Irmãos/Irmãs em Missão',
        tipo: 'PRIMITIVO',
      },
      {
        descricao: 'Irmãos/Irmãs Itinerantes',
        tipo: 'PRIMITIVO',
      },
      { descricao: 'Familia Itinerante', tipo: 'PRIMITIVO' },
      { descricao: 'Pós Crisma', tipo: 'PRIMITIVO' },
      { descricao: 'Presbítero', tipo: 'PRIMITIVO' },
      { descricao: 'Freira', tipo: 'PRIMITIVO' },
      { descricao: 'Responsável', tipo: 'VINCULADO', casalAndaJunto: true },
      { descricao: 'Co-Responsável', tipo: 'VINCULADO', casalAndaJunto: true },
      { descricao: 'Salmista', tipo: 'VINCULADO' },
      { descricao: 'Catequistas', tipo: 'VINCULADO', casalAndaJunto: true },
      { descricao: 'Leitores', tipo: 'VINCULADO' },
      { descricao: 'Ostiário', tipo: 'VINCULADO' },
      { descricao: 'Mestre', tipo: 'VINCULADO' },
      { descricao: 'Padeiro', tipo: 'VINCULADO' },
      { descricao: 'Secretário', tipo: 'SERVICO' },
      { descricao: 'Voluntário', tipo: 'SERVICO' },
      { descricao: 'Convidado', tipo: 'SERVICO' },
    ];

    for (const carisma of carismas) {
      await prisma.carisma.create({
        data: {
          descricao: carisma.descricao,
          tipo: carisma.tipo as tipoCarismaEnum,
          casalAndaJunto: carisma.casalAndaJunto || false,
        },
      });
    }

    console.log('---------------------------------');
    console.log('Carismas preenchidos com sucesso!');
  }

  async function tipoEquipe() {
    const tiposEquipe = [
      'Catequista',
      'Catequista Regional',
      'Catequista Itinerante',
      'Secretários Centro Neocatecumenal',
      'Peregrinações Jovens',
      'Perscrutação Jovens',
      'Pós-Crisma',
      'Responsável GRANDE REGIAO',
      'Vocacional - Moças',
      'Vocacional - Moços',
    ];

    for (const descricao of tiposEquipe) {
      await prisma.tipoEquipe.create({ data: { descricao } });
    }

    console.log('---------------------------------');
    console.log('Tipo de equipes preenchido com sucesso!');
  }

  async function tipoDiocese() {
    await prisma.tipoDiocese.create({
      data: {
        descricao: 'Arquidiocese',
      },
    });

    await prisma.tipoDiocese.create({
      data: {
        descricao: 'Diocese',
      },
    });

    await prisma.tipoDiocese.create({
      data: {
        descricao: 'Prelazia',
      },
    });

    console.log('---------------------------------');
    console.log('Tipo de diocese preenchido com sucesso!');
  }

  async function escolaridade() {
    const escolaridades = [
      'Analfabeto',
      'Ensino Fundamental',
      'Ensino Fundamental Incompleto',
      'Ensino Médio',
      'Ensino Médio Incompleto',
      'Ensino Superior',
      'Ensino Superior Incompleto',
      'Pos Graduação',
      'Mestrado',
      'Douturado',
      'Pos Doutorado',
    ];

    for (const descricao of escolaridades) {
      await prisma.escolaridade.create({
        data: { descricao },
      });
    }

    console.log('---------------------------------');
    console.log('Escolaridade preenchido com sucesso!');
  }

  async function estadoCivil() {
    const estadosCivis = [
      'SOLTEIRO(A)',
      'CASADO(A)',
      'VIUVO(A)',
      'DIVORCIADO(A)',
    ];

    for (const descricao of estadosCivis) {
      await prisma.estadoCivil.create({
        data: { descricao },
      });
    }

    console.log('---------------------------------');
    console.log('Estado Civil preenchido com sucesso!');
  }

  async function diocese() {
    await seedDiocese(prisma);
  }

  async function paroquia() {
    await seedParoquia(prisma);
  }

  async function comunidade() {
    await seedComunidade(prisma);
  }

  async function pessoas() {
    await prisma.pessoa.create({
      data: {
        externalId: 'id-usuario-teste-e2e-1',
        situacaoReligiosaId: 1,
      },
    });

    await prisma.pessoa.create({
      data: {
        externalId: 'id-usuario-cpf-duplicado-e2e-2',
        situacaoReligiosaId: 1,
      },
    });

    console.log('---------------------------------');
    console.log('Pessoas preenchidas com sucesso!');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
