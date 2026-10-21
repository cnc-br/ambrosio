import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';

describe('RegiaoController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
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

        expect(res.body.data).toEqual(expectedData);
      });
  });

  it('/regiao/3 (GET) - 200 | deve retornar Portinari - Setor 1', () => {
    return request(app.getHttpServer())
      .get('/regiao/3')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual({
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
});
