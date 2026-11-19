import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma.service.js';
import { setupTestModule } from '../test-setup.js';

describe('RegiaoController (e2e)', () => {
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

  const criarRegiao = async (descricao: string, macroRegiaoId = 1) => {
    const regiao = await prisma.regiao.create({
      data: { descricao, macroRegiaoId },
    });
    criados.push(regiao.id);
    return regiao;
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
    await prisma.regiao.deleteMany({
      where: { id: { in: criados } },
    });
    await app.close();
  });

  it('/regiao (GET) - 200 | get regiao sem autenticacao', () => {
    return request(app.getHttpServer())
      .get('/regiao')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('total', 4);
        expect(res.body).toHaveProperty('page', 1);
        expect(res.body).toHaveProperty('limit', 4);
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(4);

        const expectedData = [
          {
            id: 1,
            descricao: 'Franca',
            macroRegiaoId: 1,
            ativo: true,
            macroRegiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
            },
          },
          {
            id: 2,
            descricao: 'Ceará',
            macroRegiaoId: 2,
            ativo: true,
            macroRegiao: {
              id: 2,
              descricao: 'Brasília',
              ativo: true,
            },
          },
          {
            id: 3,
            descricao: 'Piauí',
            macroRegiaoId: 3,
            ativo: true,
            macroRegiao: {
              id: 3,
              descricao: 'Goiás',
              ativo: true,
            },
          },
          {
            id: 4,
            descricao: 'Campo Limpo',
            macroRegiaoId: 1,
            ativo: true,
            macroRegiao: {
              id: 1,
              descricao: 'Franca',
              ativo: true,
            },
          },
        ];

        expectedData.forEach((item, index) => {
          expect(res.body.data[index]).toMatchObject(item);
        });
      });
  });

  it('/regiao/3 (GET) - 200 | deve retornar Portinari - Setor 1', () => {
    return request(app.getHttpServer())
      .get('/regiao/3')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toMatchObject({
          id: 3,
          descricao: 'Piauí',
          macroRegiaoId: 3,
          ativo: true,
          macroRegiao: {
            id: 3,
            descricao: 'Goiás',
            ativo: true,
          },
        });
      });
  });

  it('/regiao/aaaa (GET) - 400 | deve retornar erro de validação', () => {
    return request(app.getHttpServer())
      .get('/regiao/aaaa')
      .expect(400)
      .expect((res) => {
        expect(res.body).toEqual({
          statusCode: 400,
          message:
            'O parâmetro "id" deve ser um número inteiro positivo válido.',
          error: 'Bad Request',
        });
      });
  });

  it('/regiao (POST) - 401 | não pode cadastrar sem autenticação', () => {
    return request(app.getHttpServer())
      .post('/regiao')
      .send({ descricao: 'Sem token', macroRegiao: { id: 1 } })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/regiao (POST) - 403 | não pode cadastrar como SECRETARIA_PAROQUIA', () => {
    return request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão', macroRegiao: { id: 1 } })
      .expect(403)
      .expect((res) => {
        expect(res.body.statusCode).toBe(403);
      });
  });

  it('/regiao (POST) - 201 | ADMIN cadastra e a auditoria não é exposta', async () => {
    const response = await request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Região Admin', macroRegiao: { id: 1 } })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Região Admin',
      macroRegiaoId: 1,
      ativo: true,
      macroRegiao: { id: 1 },
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criado = await prisma.regiao.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBe(adminUserId);
    expect(criado.atualizadoPorId).toBe(adminUserId);
  });

  it('/regiao (POST) - 201 | SECRETARIA_CNC cadastra', async () => {
    const response = await request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        descricao: 'E2E Região CNC',
        macroRegiao: { id: 2 },
        ativo: false,
      })
      .expect(201);

    criados.push(response.body.data.id);

    expect(response.body.data).toMatchObject({
      descricao: 'E2E Região CNC',
      macroRegiaoId: 2,
      ativo: false,
      macroRegiao: { id: 2 },
    });
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
  });

  it('/regiao (POST) - 400 | rejeita região duplicada', () => {
    return request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Região Admin', macroRegiao: { id: 1 } })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('/regiao (POST) - 400 | rejeita payload sem macro-região', () => {
    return request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E sem macro' })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it('/regiao (POST) - 404 | macro-região inexistente', () => {
    return request(app.getHttpServer())
      .post('/regiao')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E macro inexistente', macroRegiao: { id: 999999 } })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });

  it('/regiao/:id (PATCH) - 401 | não pode atualizar sem autenticação', async () => {
    const regiao = await criarRegiao('E2E Região para 401');

    return request(app.getHttpServer())
      .patch(`/regiao/${regiao.id}`)
      .send({ descricao: 'Sem token' })
      .expect(401);
  });

  it('/regiao/:id (PATCH) - 403 | não pode atualizar como SECRETARIA_PAROQUIA', async () => {
    const regiao = await criarRegiao('E2E Região para 403');

    return request(app.getHttpServer())
      .patch(`/regiao/${regiao.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaParoquia}`)
      .send({ descricao: 'Sem permissão' })
      .expect(403);
  });

  it('/regiao/:id (PATCH) - 200 | atualiza sem macroRegião e mantém o vínculo', async () => {
    const regiao = await criarRegiao('E2E Região antes', 1);

    const response = await request(app.getHttpServer())
      .patch(`/regiao/${regiao.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'E2E Região depois' })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: regiao.id,
      descricao: 'E2E Região depois',
      macroRegiaoId: 1,
      macroRegiao: { id: 1 },
    });
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const atualizado = await prisma.regiao.findUniqueOrThrow({
      where: { id: regiao.id },
    });
    expect(atualizado.macroRegiaoId).toBe(1);
    expect(atualizado.atualizadoPorId).toBe(adminUserId);
  });

  it('/regiao/:id (PATCH) - 200 | move a região de macro-região', async () => {
    const regiao = await criarRegiao('E2E Região móvel', 1);

    const response = await request(app.getHttpServer())
      .patch(`/regiao/${regiao.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ macroRegiao: { id: 3 } })
      .expect(200);

    expect(response.body.data).toMatchObject({
      id: regiao.id,
      macroRegiaoId: 3,
      macroRegiao: { id: 3 },
    });
  });

  it('/regiao/:id (PATCH) - 404 | região inexistente', () => {
    return request(app.getHttpServer())
      .patch('/regiao/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ descricao: 'Inexistente' })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });

  it('/regiao/:id (PATCH) - 404 | macro-região inexistente na atualização', async () => {
    const regiao = await criarRegiao('E2E Região macro 404');

    return request(app.getHttpServer())
      .patch(`/regiao/${regiao.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ macroRegiao: { id: 999999 } })
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
      });
  });
});
