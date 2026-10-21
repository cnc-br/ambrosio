import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/(GET) - 200 | deve retornar mensagem de boas-vindas', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBe(
          'Hello World! Bem vindo ao Caminho Neocatecumenal',
        );
      });
  });
});
