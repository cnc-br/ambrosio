import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { PrismaService } from 'src/prisma.service.js';

describe('EstadoCivilController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'estado-civil';
  let token = '';
  let adminUserId = '';

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@admin.com' },
    });
    adminUserId = admin.id;

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });

    token = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 200 | deve retornar os estados civis`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data).toContainEqual(
          expect.objectContaining({ id: 2, descricao: 'CASADO(A)' }),
        );
      });
  });

  it(`/${principal}/:id (GET) - 200 | deve retornar o estado civil by id`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}/2`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).not.toBeInstanceOf(Array);
        expect(res.body.data).toEqual(
          expect.objectContaining({ id: 2, descricao: 'CASADO(A)' }),
        );
        expect(res.body.data.id).toEqual(2);
        expect(res.body.data.descricao).toEqual('CASADO(A)');
      });
  });

  it(`/${principal} (POST) - 400 | nao deve cadastrar estado civil com payload invalido`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: 123 })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('descricao must be a string');
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/${principal} (DELETE) - 404 | delete de estado civil não é permitido`, () => {
    return request(app.getHttpServer())
      .delete(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot DELETE /${principal}`);
        expect(res.body.error).toBe('Not Found');
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (PATCH) - 404 | atualizacao patch de estado civil não é permitido`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PATCH /${principal}`);
        expect(res.body.error).toBe('Not Found');
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (PUT) - 404 | atualizacao put de estado civil não é permitido`, () => {
    return request(app.getHttpServer())
      .put(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PUT /${principal}`);
        expect(res.body.error).toBe('Not Found');
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal}/:id (GET) - 404 | deve retornar estado civil nao encontrado by id`, async () => {
    return request(app.getHttpServer())
      .get(`/${principal}/23424`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Estado Civil' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (POST) - 201 | registra o usuário autenticado e não expõe auditoria`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ descricao: `AUDIT ${Date.now()}` });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criado = await prisma.estadoCivil.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criado.cadastradoPorId).toBe(adminUserId);
    expect(criado.atualizadoPorId).toBe(adminUserId);
  });
});
