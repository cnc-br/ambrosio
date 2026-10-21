import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';

describe('TipoLocalidadeController (e2e)', () => {
  let app: INestApplication;
  const principal = 'tipo-localidade'

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 200 | deve retornar os tipos de localidade`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data).toContainEqual({ id: 1, descricao: 'Centro Neocatecumenal' });
      });
  });

  it(`/${principal} (GET) - 200 | deve retornar o tipo de localidade by id`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}/2`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).not.toBeInstanceOf(Array);
        expect(res.body.data).toEqual({ id: 2, descricao: 'Seminário' });
        expect(res.body.data.id).toEqual(2);
        expect(res.body.data.descricao).toEqual('Seminário');
      });
  });

  it(`/${principal} (POST) - 404 | cadastro de tipo de localidade não é permitido`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot POST /${principal}`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal} (DELETE) - 404 | delete de tipo de localidade não é permitido`, () => {
    return request(app.getHttpServer())
      .delete(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot DELETE /${principal}`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal} (PATCH) - 404 | atualizacao patch de tipo de localidade não é permitido`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PATCH /${principal}`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });

  it(`/${principal} (PUT) - 404 | atualizacao put de tipo de localidade não é permitido`, () => {
    return request(app.getHttpServer())
      .put(`/${principal}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(`Cannot PUT /${principal}`)
        expect(res.body.error).toBe('Not Found')
        expect(res.body.statusCode).toBe(404)
      });
  });
});

