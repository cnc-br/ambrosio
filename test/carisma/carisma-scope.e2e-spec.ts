/* eslint-disable @typescript-eslint/no-explicit-any */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from '../mocks/sao-pedro-api-mock.js';

const ADMIN_PASSWORD_HASH =
  '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC';

describe('CarismaScope (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let tokenAdmin = '';
  let tokenSecretaria1 = '';
  let tokenSecretaria2 = '';

  let secretaria1UserId = '';
  let secretaria2UserId = '';

  let pessoaPropria: { id: number; externalId: string };
  let pessoaOutra: { id: number; externalId: string };
  let pessoaSemVinculo: { id: number; externalId: string };
  let carismaId: number;
  let carisma2Id: number;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  const criarPessoa = async (
    externalId: string,
  ): Promise<{ id: number; externalId: string }> => {
    return prisma.pessoa.create({
      data: {
        externalId,
        situacaoReligiosaId: 1,
        cadastradoPorId: secretaria1UserId,
        atualizadoPorId: secretaria1UserId,
      },
      select: { id: true, externalId: true },
    });
  };

  const criarVinculo = async (
    pessoaId: number,
    comunidadeId: number,
    dataSaida: Date | null = null,
  ) => {
    await prisma.comunidadePessoa.create({
      data: {
        pessoaId,
        comunidadeId,
        dataEntrada: new Date(),
        dataSaida,
      },
    });
  };

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SaoPedroPessoaService,
        value: mockSaoPedroPessoaService,
      },
      {
        provider: SaoPedroContatoService,
        value: mockSaoPedroContatoService,
      },
    ]);

    prisma = app.get(PrismaService);

    const secretaria1 = await prisma.user.findUniqueOrThrow({
      where: { email: 'secretaria@admin.com' },
    });
    secretaria1UserId = secretaria1.id;

    const secretaria2 = await prisma.user.upsert({
      where: { email: 'secretaria2@admin.com' },
      update: { role: 'SECRETARIA_CNC', active: true },
      create: {
        email: 'secretaria2@admin.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'SECRETARIA_CNC',
        active: true,
      },
    });
    secretaria2UserId = secretaria2.id;

    await prisma.usuarioParoquia.upsert({
      where: {
        userId_paroquiaId: {
          userId: secretaria2UserId,
          paroquiaId: 2,
        },
      },
      update: {},
      create: {
        userId: secretaria2UserId,
        paroquiaId: 2,
      },
    });

    tokenAdmin = await login('admin@admin.com');
    tokenSecretaria1 = await login('secretaria@admin.com');
    tokenSecretaria2 = await login('secretaria2@admin.com');

    const comunidade1 = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: 1 },
    });
    const comunidade2 = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: 2 },
    });

    const carismas = await prisma.carisma.findMany({
      take: 2,
      orderBy: { id: 'asc' },
    });
    carismaId = carismas[0].id;
    carisma2Id = carismas[1].id;

    pessoaPropria = await criarPessoa('e2e-carisma-propria-1');
    await criarVinculo(pessoaPropria.id, comunidade1.id);

    pessoaOutra = await criarPessoa('e2e-carisma-outra-1');
    await criarVinculo(pessoaOutra.id, comunidade2.id);

    pessoaSemVinculo = await criarPessoa('e2e-carisma-sem-vinculo-1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('SECRETARIA_CNC da paróquia 1 adiciona carismas a pessoa da própria paróquia', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(201);
    expect(response.body.data.adicionados).toBe(1);
  });

  it('SECRETARIA_CNC da paróquia 1 não adiciona carismas a pessoa de outra paróquia', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('SECRETARIA_CNC da paróquia 1 adiciona carismas a pessoa sem vínculo ativo', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaSemVinculo.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(201);
    expect(response.body.data.adicionados).toBe(1);
  });

  it('ADMIN adiciona carismas a pessoa de qualquer paróquia', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(201);
    expect(response.body.data.adicionados).toBe(1);
  });

  it('SECRETARIA_CNC da paróquia 2 adiciona carismas a pessoa da própria paróquia', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria2}`)
      .send({ carismaIds: [carismaId, carisma2Id] });

    expect(response.status).toBe(201);
    expect(response.body.data.adicionados).toBe(1);
  });

  it('SECRETARIA_CNC da paróquia 1 remove carismas de pessoa da própria paróquia', async () => {
    await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carismaId, carisma2Id] });

    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carisma2Id] });

    expect(response.status).toBe(201);
    expect(response.body.data.removidos).toBe(1);
  });

  it('SECRETARIA_CNC da paróquia 1 não remove carismas de pessoa de outra paróquia', async () => {
    await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ carismaIds: [carismaId, carisma2Id] });

    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carisma2Id] });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
  });

  it('SECRETARIA_CNC da paróquia 1 não adiciona carismas a pessoa inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/carismas/pessoa/999999')
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(404);
    expect(response.body.statusCode).toBe(404);
  });
});
