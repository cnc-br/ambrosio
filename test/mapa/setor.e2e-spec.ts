import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';

describe('SetorController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestModule();
  });

  afterAll(async () => {
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

        expect(res.body.data).toEqual(expectedData);
      });
  });

  it('/setor/3 (GET) - 200 | deve retornar Portinari - Setor 1', () => {
    return request(app.getHttpServer())
      .get('/setor/3')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toEqual({
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

        expect(res.body.data).toEqual(expectedData);
      });
  });
});
