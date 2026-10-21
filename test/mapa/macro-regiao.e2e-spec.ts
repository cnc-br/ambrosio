import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';

describe('MacroRegiaoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
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

        expect(res.body.data).toEqual(expectedData);
      });
  });

  it('/macro-regiao/2 (GET) - 200 | deve retornar Brasília', () => {
    return request(app.getHttpServer())
      .get('/macro-regiao/2')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual({
          id: 2,
          descricao: 'Brasília',
          ativo: true,
        });
      });
  });
});
