import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma.service.js';
import { setupTestModule } from '../test-setup.js';

describe('SetorController (e2e)', () => {
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

  const criarSetor = async (descricao: string, regiaoId = 1) => {
    const setor = await prisma.setor.create({
      data: { descricao, regiaoId },
    });
    criados.push(setor.id);
    return setor;
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
    await prisma.setor.deleteMany({
      where: { id: { in: criados } },
    });
    await app.close();
  });

  it('/setor (GET) - 200 | get setor sem autenticacao', () => {
    return request(app.getHttpServer())
      .get('/setor')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('total', 12);
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 12);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(12);

        const expectedData = [
          {
            id: 1,
            descricao: 'Anhaguera - Setor 1',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 2,
            descricao: 'Anhaguera - Setor 2',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 3,
            descricao: 'Portinari - Setor 1',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 4,
            descricao: 'Portinari - Setor 2',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 5,
            descricao: 'Brasilia - Setor 1',
            regiaoId: 2,
            ativo: true,
            regiao: {
              id: 2,
              descricao: 'Ceará',
              ativo: true,
              macroRegiaoId: 2,
            },
          },
          {
            id: 6,
            descricao: 'Brasilia - Setor 2',
            regiaoId: 2,
            ativo: true,
            regiao: {
              id: 2,
              descricao: 'Ceará',
              ativo: true,
              macroRegiaoId: 2,
            },
          },
          {
            id: 7,
            descricao: 'Brasilia - Setor 3',
            regiaoId: 2,
            ativo: true,
            regiao: {
              id: 2,
              descricao: 'Ceará',
              ativo: true,
              macroRegiaoId: 2,
            },
          },
          {
            id: 8,
            descricao: 'Brasilia - Setor 4',
            regiaoId: 2,
            ativo: true,
            regiao: {
              id: 2,
              descricao: 'Ceará',
              ativo: true,
              macroRegiaoId: 2,
            },
          },
          {
            id: 9,
            descricao: 'Brasilia - Setor 5',
            regiaoId: 2,
            ativo: true,
            regiao: {
              id: 2,
              descricao: 'Ceará',
              ativo: true,
              macroRegiaoId: 2,
            },
          },
          {
            id: 10,
            descricao: 'Centro Oeste - GO 1',
            regiaoId: 3,
            ativo: true,
            regiao: {
              id: 3,
              descricao: 'Piauí',
              ativo: true,
              macroRegiaoId: 3,
            },
          },
          {
            id: 11,
            descricao: 'Centro Oeste - GO 2',
            regiaoId: 3,
            ativo: true,
            regiao: {
              id: 3,
              descricao: 'Piauí',
              ativo: true,
              macroRegiaoId: 3,
            },
          },
          {
            id: 12,
            descricao: 'Centro Oeste - GO 3',
            regiaoId: 3,
            ativo: true,
            regiao: {
              id: 3,
              descricao: 'Piauí',
              ativo: true,
              macroRegiaoId: 3,
            },
          },
        ];

        expectedData.forEach((item, index) => {
          expect(res.body.data[index]).toMatchObject(item);
        });
      });
  });

  it('/setor/3 (GET) - 200 | deve retornar Portinari - Setor 1', () => {
    return request(app.getHttpServer())
      .get('/setor/3')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toMatchObject({
          id: 3,
          descricao: 'Portinari - Setor 1',
          regiaoId: 1,
          ativo: true,
          regiao: {
            id: 1,
            descricao: 'Franca',
            macroRegiaoId: 1,
            ativo: true,
          },
        });
      });
  });

  it('/setor?regiaoId=1 (GET) - 200 | deve retornar setores da regiao Centro Oeste', () => {
    return request(app.getHttpServer())
      .get('/setor?regiaoId=1')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(4);

        const expectedData = [
          {
            id: 1,
            descricao: 'Anhaguera - Setor 1',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 2,
            descricao: 'Anhaguera - Setor 2',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 3,
            descricao: 'Portinari - Setor 1',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
          {
            id: 4,
            descricao: 'Portinari - Setor 2',
            regiaoId: 1,
            ativo: true,
            regiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
              macroRegiaoId: 1,
            },
          },
        ];

        expectedData.forEach((item, index) => {
          expect(res.body.data[index]).toMatchObject(item);
        });
      });
  });

  it('/setor (POST) - 401 | não pode cadastrar sem autenticação', () => {
    return request(app.getHttpServer())
      .post('/setor')
      .send({ descricao: 'Sem token', regiao: { id: 1 } })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/setor (POST) - 403 | não pode cadastrar como SECRETARIA_PAROQUIA', () => {
    return request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão', regiao: { id: 1 } })
      .expect(403)
      .expect((res) => {
        expect(res.body.statusCode).toBe(403);
      });
  });

  it('/setor (POST) - 201 | ADMIN cadastra e a auditoria não é exposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Setor Admin', regiao: { id: 1 } })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Setor Admin',
      regiaoId: 1,
      ativo: true,
      regiao: { id: 1 },
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criado = await prisma.setor.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBe(adminUserId);
    expect(criado.atualizadoPorId).toBe(adminUserId);
  });

  it('/setor (POST) - 201 | SECRETARIA_CNC cadastra', async () => {
    const response = await request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        descricao: 'E2E Setor CNC',
        regiao: { id: 2 },
        ativo: false,
      })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Setor CNC',
      regiaoId: 2,
      ativo: false,
      regiao: { id: 2 },
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
  });

  it('/setor (POST) - 400 | rejeita setor duplicado', () => {
    return request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Setor Admin', regiao: { id: 1 } })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('/setor (POST) - 400 | rejeita payload sem região', () => {
    return request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E sem região' })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('/setor (POST) - 404 | região inexistente', () => {
    return request(app.getHttpServer())
      .post('/setor')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E região inexistente', regiao: { id: 999999 } })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });

  it('/setor/:id (PATCH) - 401 | não pode atualizar sem autenticação', async () => {
    const setor = await criarSetor('E2E Setor para 401');

    return request(app.getHttpServer())
      .patch(`/setor/${setor.id}`)
      .send({ descricao: 'Sem token' })
      .expect(401);
  });

  it('/setor/:id (PATCH) - 403 | não pode atualizar como SECRETARIA_PAROQUIA', async () => {
    const setor = await criarSetor('E2E Setor para 403');

    return request(app.getHttpServer())
      .patch(`/setor/${setor.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão' })
      .expect(403);
  });

  it('/setor/:id (PATCH) - 200 | atualiza sem regiao e mantém o vínculo', async () => {
    const setor = await criarSetor('E2E Setor antes', 1);

    const response = await request(app.getHttpServer())
      .patch(`/setor/${setor.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ ativo: false })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: setor.id,
      descricao: 'E2E Setor antes',
      ativo: false,
      regiaoId: 1,
      regiao: { id: 1 },
    });
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const atualizado = await prisma.setor.findUniqueOrThrow({
      where: { id: setor.id },
    });
    expect(atualizado.regiaoId).toBe(1);
    expect(atualizado.atualizadoPorId).toBe(adminUserId);
  });

  it('/setor/:id (PATCH) - 200 | move o setor de região', async () => {
    const setor = await criarSetor('E2E Setor móvel', 1);

    const response = await request(app.getHttpServer())
      .patch(`/setor/${setor.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ regiao: { id: 3 } })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: setor.id,
      regiaoId: 3,
      regiao: { id: 3 },
    });
  });

  it('/setor/:id (PATCH) - 404 | setor inexistente', () => {
    return request(app.getHttpServer())
      .patch('/setor/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'Inexistente' })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });

  it('/setor/:id (PATCH) - 404 | região inexistente na atualização', async () => {
    const setor = await criarSetor('E2E Setor região 404');

    return request(app.getHttpServer())
      .patch(`/setor/${setor.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ regiao: { id: 999999 } })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });
});
