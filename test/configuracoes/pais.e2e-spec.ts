import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';

describe('PaisController (e2e)', () => {
  let app: INestApplication;
  const principal = 'pais';

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 200 | deve retornar os paises cadastrados na base`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data[0]).toBeInstanceOf(Object);
        expect(typeof res.body.data[0].id).toBe('number');
        expect(typeof res.body.data[0].nome).toBe('string');
        expect(res.body.data[0].id).toBe(1);
        expect(res.body.data[0].nome).toBe('Brasil');
      });
  });

  it(`/${principal} (GET) - 200 | deve retornar um pais  by id`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}/2`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.id).toBe(2);
        expect(res.body.data.nome).toBe('Peru');
      });
  });

  it(`/${principal} (GET) - 404 | deve retornar 404 um pais by id nao existente`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}/21858`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'País' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (POST) - 201 | deve cadastrar um pais com sucesso`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .send({
        nome: 'Argentina',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data.nome).toBe('Argentina');
      });
  });

  it(`/${principal}/:id (DELETE) - 404 | delete de pais não é permitido`, () => {
    return request(app.getHttpServer())
      .delete(`/${principal}/2`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot DELETE /${principal}/2`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal}/:id (PATCH) - 404 | atualizacao patch de pais não é permitido`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}/3`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PATCH /${principal}/3`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal}/:id (PUT) - 404 | atualizacao put de pais não é permitido`, () => {
    return request(app.getHttpServer())
      .put(`/${principal}/2`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PUT /${principal}/2`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal} (POST) - 400 | deve retornar 400 ao cadastrar um pais com nome maior que 100 caracteres`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .send({
        nome: 'Argentinaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message[0]).toBe('nome must be shorter than or equal to 100 characters');
        expect(res.body.statusCode).toBe(400);
      });
  });
});
