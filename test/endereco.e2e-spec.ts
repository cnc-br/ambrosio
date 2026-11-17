import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { PrismaService } from 'src/prisma.service.js';

describe('EnderecoController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'endereco';

  let tokenAdmin = '';
  let adminUserId = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  const payloadEndereco = (cidade: string) => ({
    cep: '13208200',
    logradouro: 'Rua Auditoria',
    numero: '100',
    bairro: 'Centro',
    cidade,
    UF: 'SP',
  });

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@admin.com' },
    });
    adminUserId = admin.id;
    tokenAdmin = await login('admin@admin.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal}/pessoa/:id (POST) - 201 | sem token grava auditoria nula`, async () => {
    const pessoa = await prisma.pessoa.findFirstOrThrow();

    const response = await request(app.getHttpServer())
      .post(`/${principal}/pessoa/${pessoa.id}`)
      .send(payloadEndereco(`Cidade sem token ${Date.now()}`));

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');

    const criado = await prisma.endereco.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBeNull();
    expect(criado.atualizadoPorId).toBeNull();

    const vinculo = await prisma.pessoaEndereco.findFirstOrThrow({
      where: { pessoaId: pessoa.id, enderecoId: criado.id },
    });
    expect(vinculo.cadastradoPorId).toBeNull();
    expect(vinculo.atualizadoPorId).toBeNull();
  });

  it(`/${principal}/pessoa/:id (POST) - 201 | com token grava o usuário autenticado`, async () => {
    const pessoa = await prisma.pessoa.findFirstOrThrow();

    const response = await request(app.getHttpServer())
      .post(`/${principal}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(payloadEndereco(`Cidade com token ${Date.now()}`));

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criado = await prisma.endereco.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBe(adminUserId);
    expect(criado.atualizadoPorId).toBe(adminUserId);

    const vinculo = await prisma.pessoaEndereco.findFirstOrThrow({
      where: { pessoaId: pessoa.id, enderecoId: criado.id },
    });
    expect(vinculo.cadastradoPorId).toBe(adminUserId);
    expect(vinculo.atualizadoPorId).toBe(adminUserId);
  });

  it(`/${principal}/:id (PATCH) - 200 | com token grava atualizadoPorId`, async () => {
    const pessoa = await prisma.pessoa.findFirstOrThrow();
    const criado = await request(app.getHttpServer())
      .post(`/${principal}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send(payloadEndereco(`Cidade update ${Date.now()}`))
      .expect(201);

    await prisma.endereco.update({
      where: { id: criado.body.data.id },
      data: { cadastradoPorId: null, atualizadoPorId: null },
    });

    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${criado.body.data.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        ...payloadEndereco(`Cidade update destino ${Date.now()}`),
        id: criado.body.data.id,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const atualizado = await prisma.endereco.findUniqueOrThrow({
      where: { id: criado.body.data.id },
    });
    expect(atualizado.atualizadoPorId).toBe(adminUserId);
  });
});
