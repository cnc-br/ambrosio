import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma.service.js';
import { setupTestModule } from '../test-setup.js';

describe('MacroRegiaoController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin = '';
  let tokenSecretariaCnc = '';
  let tokenSecretariaParoquia = '';
  let adminUserId = '';
  const criados: number[] = [];

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);

    tokenAdmin = await login('admin@admin.com');
    tokenSecretariaCnc = await login('secretaria-cnc@admin.com');
    tokenSecretariaParoquia = await login('secretaria@admin.com');

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@admin.com' },
    });
    adminUserId = admin.id;
  });

  afterAll(async () => {
    await prisma.macroRegiao.deleteMany({
      where: { id: { in: criados } },
    });
    await app.close();
  });

  it('/macro-regiao (GET) - 200 | get macro-regiao sem autenticacao', () => {
    return request(app.getHttpServer())
      .get('/macro-regiao')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('total', 3);
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 3);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(3);

        const expectedData = [
          { id: 1, descricao: 'Franca', ativo: true },
          { id: 2, descricao: 'Brasília', ativo: true },
          { id: 3, descricao: 'Goiás', ativo: true },
        ];

        expectedData.forEach((item, index) => {
          expect(res.body.data[index]).toMatchObject(item);
        });
      });
  });

  it('/macro-regiao/2 (GET) - 200 | deve retornar Brasília', () => {
    return request(app.getHttpServer())
      .get('/macro-regiao/2')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toMatchObject({
          id: 2,
          descricao: 'Brasília',
          ativo: true,
        });
      });
  });

  it('/macro-regiao (POST) - 401 | não pode cadastrar sem autenticação', () => {
    return request(app.getHttpServer())
      .post('/macro-regiao')
      .send({ descricao: 'Sem token' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/macro-regiao (POST) - 403 | não pode cadastrar como SECRETARIA_PAROQUIA', () => {
    return request(app.getHttpServer())
      .post('/macro-regiao')
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão' })
      .expect(403)
      .expect((res) => {
        expect(res.body.statusCode).toBe(403);
      });
  });

  it('/macro-regiao (POST) - 201 | ADMIN cadastra e a auditoria não é exposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/macro-regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Sudeste' })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Sudeste',
      ativo: true,
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criado = await prisma.macroRegiao.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBe(adminUserId);
    expect(criado.atualizadoPorId).toBe(adminUserId);
  });

  it('/macro-regiao (POST) - 201 | SECRETARIA_CNC cadastra', async () => {
    const response = await request(app.getHttpServer())
      .post('/macro-regiao')
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({ descricao: 'E2E Nordeste', ativo: false })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Nordeste',
      ativo: false,
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');
  });

  it('/macro-regiao (POST) - 400 | rejeita payload inválido', () => {
    return request(app.getHttpServer())
      .post('/macro-regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'a'.repeat(51) })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('/macro-regiao/:id (PATCH) - 401 | não pode atualizar sem autenticação', async () => {
    const macroRegiao = await prisma.macroRegiao.create({
      data: { descricao: 'E2E para 401' },
    });
    criados.push(macroRegiao.id);

    return request(app.getHttpServer())
      .patch(`/macro-regiao/${macroRegiao.id}`)
      .send({ descricao: 'Sem token' })
      .expect(401);
  });

  it('/macro-regiao/:id (PATCH) - 403 | não pode atualizar como SECRETARIA_PAROQUIA', async () => {
    const macroRegiao = await prisma.macroRegiao.create({
      data: { descricao: 'E2E para 403' },
    });
    criados.push(macroRegiao.id);

    return request(app.getHttpServer())
      .patch(`/macro-regiao/${macroRegiao.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão' })
      .expect(403);
  });

  it('/macro-regiao/:id (PATCH) - 200 | ADMIN atualiza e grava a autoria', async () => {
    const macroRegiao = await prisma.macroRegiao.create({
      data: { descricao: 'E2E antes' },
    });
    criados.push(macroRegiao.id);

    const response = await request(app.getHttpServer())
      .patch(`/macro-regiao/${macroRegiao.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E depois', ativo: false })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: macroRegiao.id,
      descricao: 'E2E depois',
      ativo: false,
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const atualizado = await prisma.macroRegiao.findUniqueOrThrow({
      where: { id: macroRegiao.id },
    });
    expect(atualizado.atualizadoPorId).toBe(adminUserId);
  });

  it('/macro-regiao/:id (PATCH) - 404 | macro-região inexistente', () => {
    return request(app.getHttpServer())
      .patch('/macro-regiao/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'Inexistente' })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });
});
