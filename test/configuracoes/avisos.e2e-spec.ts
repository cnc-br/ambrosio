import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma.service.js';
import { setupTestModule } from '../test-setup.js';

describe('AvisosController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenAdmin = '';
  let tokenSemPermissao = '';

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
    tokenSemPermissao = await login('ronaldinho@admin.com');

    await prisma.aviso.deleteMany();
  });

  afterAll(async () => {
    await prisma.aviso.deleteMany();
    await app.close();
  });

  it(`/avisos (GET) - 200 | retorna múltiplos avisos sem autenticação, no envelope`, async () => {
    await prisma.aviso.createMany({
      data: [
        {
          texto: 'Aviso de teste C',
          dataFim: new Date('2026-06-30T23:59:59.000Z'),
        },
        {
          texto: 'Aviso de teste A',
          dataFim: new Date('2026-12-31T23:59:59.000Z'),
        },
        {
          texto: 'Aviso de teste B',
          dataFim: new Date('2027-01-31T23:59:59.000Z'),
        },
      ],
    });

    return request(app.getHttpServer())
      .get('/avisos')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('limit');
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3);

        const datas = res.body.data.map(
          (aviso: { dataFim: string }) => new Date(aviso.dataFim).getTime(),
        );
        const ordenadoDesc = [...datas].sort((a, b) => b - a);
        expect(datas).toEqual(ordenadoDesc);
      });
  });

  it(`/avisos/:id (GET) - 200 | retorna um aviso sem autenticação`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Aviso individual',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .get(`/avisos/${aviso.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.id).toBe(aviso.id);
        expect(res.body.data.texto).toBe('Aviso individual');
        expect(res.body.data.dataFim).toBeDefined();
      });
  });

  it(`/avisos/:id (GET) - 404 | aviso inexistente`, () => {
    return request(app.getHttpServer())
      .get('/avisos/999999')
      .expect(404)
      .expect((res) => {
        expect(res.body.statusCode).toBe(404);
        expect(typeof res.body.message).toBe('string');
      });
  });

  it(`/avisos/:id (GET) - 406 | id não numérico`, () => {
    return request(app.getHttpServer())
      .get('/avisos/abc')
      .expect(406)
      .expect((res) => {
        expect(res.body.statusCode).toBe(406);
        expect(typeof res.body.message).toBe('string');
      });
  });

  it(`/avisos (POST) - 401 | não pode cadastrar sem autenticação`, () => {
    return request(app.getHttpServer())
      .post('/avisos')
      .send({ texto: 'Aviso sem dono', dataFim: '2026-12-31T23:59:59.000Z' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/avisos (POST) - 403 | não pode cadastrar sem papel ADMIN`, () => {
    return request(app.getHttpServer())
      .post('/avisos')
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .send({ texto: 'Aviso sem papel', dataFim: '2026-12-31T23:59:59.000Z' })
      .expect(403)
      .expect((res) => {
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/avisos (POST) - 201 | administrador cadastra um aviso`, async () => {
    const response = await request(app.getHttpServer())
      .post('/avisos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        texto: 'Aviso cadastrado pelo admin',
        dataFim: '2027-05-01T00:00:00.000Z',
      })
      .expect(201);

    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.texto).toBe('Aviso cadastrado pelo admin');
    expect(new Date(response.body.data.dataFim)).toEqual(
      new Date('2027-05-01T00:00:00.000Z'),
    );
  });

  it(`/avisos (POST) - 400 | rejeita cadastro sem dataFim`, () => {
    return request(app.getHttpServer())
      .post('/avisos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ texto: 'Aviso sem data' })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/avisos/:id (PATCH) - 401 | não pode atualizar sem autenticação`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Aviso para 401',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .patch(`/avisos/${aviso.id}`)
      .send({ texto: 'Sem token' })
      .expect(401);
  });

  it(`/avisos/:id (PATCH) - 403 | não pode atualizar sem papel ADMIN`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Aviso para 403',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .patch(`/avisos/${aviso.id}`)
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .send({ texto: 'Sem papel' })
      .expect(403);
  });

  it(`/avisos/:id (PATCH) - 200 | administrador atualiza apenas o texto`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Antes',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/avisos/${aviso.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ texto: 'Depois' })
      .expect(200);

    expect(response.body.data.id).toBe(aviso.id);
    expect(response.body.data.texto).toBe('Depois');
    expect(new Date(response.body.data.dataFim)).toEqual(
      new Date('2026-12-31T23:59:59.000Z'),
    );
  });

  it(`/avisos/:id (PATCH) - 406 | id não numérico mesmo autenticado como ADMIN`, () => {
    return request(app.getHttpServer())
      .patch('/avisos/abc')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ texto: 'Não importa' })
      .expect(406)
      .expect((res) => {
        expect(res.body.statusCode).toBe(406);
      });
  });

  it(`/avisos/:id (PATCH) - 400 | rejeita texto null em vez de erro de servidor`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Cadastrado',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .patch(`/avisos/${aviso.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ texto: null })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/avisos/:id (PATCH) - 400 | rejeita dataFim null em vez de erro de servidor`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Cadastrado',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .patch(`/avisos/${aviso.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ dataFim: null })
      .expect(400)
      .expect((res) => {
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/avisos/:id (DELETE) - 404 | rota de exclusão não existe`, async () => {
    const aviso = await prisma.aviso.create({
      data: {
        texto: 'Não deve ser apagado manualmente',
        dataFim: new Date('2026-12-31T23:59:59.000Z'),
      },
    });

    return request(app.getHttpServer())
      .delete(`/avisos/${aviso.id}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot DELETE /avisos/${aviso.id}`);
        expect(res.body.statusCode).toBe(404);
      });
  });
});
