import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';

describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  const principal = 'dashboard';

  let tokenAdmin = '';
  let tokenSemPermissao = '';
  let tokenSecretaria = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule();

    tokenAdmin = await login('admin@admin.com');
    tokenSemPermissao = await login('ronaldinho@admin.com');
    tokenSecretaria = await login('secretaria@admin.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 401 | nao pode ver indicadores sem autenticacao`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (GET) - 403 | nao pode ver indicadores com perfil nao identificado`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para acessar o dashboard.',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
        expect(res.body.data).toBeUndefined();
      });
  });

  it(`/${principal} (GET) - 200 | deve retornar indicadores no envelope padrao`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.body.server).toContain('/dashboard');
    expect(res.body.total).toBe(1);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(1);

    const indicadores = res.body.data;
    expect(indicadores.pessoas).toEqual({
      total: expect.any(Number),
      ativas: expect.any(Number),
      inativas: expect.any(Number),
    });
    expect(indicadores.pessoas.total).toBe(
      indicadores.pessoas.ativas + indicadores.pessoas.inativas,
    );
    expect(indicadores.paroquias).toEqual(expect.any(Number));
    expect(indicadores.dioceses).toEqual(expect.any(Number));
    expect(indicadores.comunidades).toEqual(expect.any(Number));
    expect(indicadores.equipes).toEqual(expect.any(Number));
    expect(indicadores.carismas).toEqual({
      total: expect.any(Number),
      vinculos: expect.any(Number),
    });
    expect(indicadores.usuarios.total).toEqual(expect.any(Number));
    expect(Object.keys(indicadores.usuarios.porPapel)).toEqual([
      'ADMIN',
      'CATEQUISTA_NACIONAL',
      'CATEQUISTA_GRANDE_REGIAO',
      'CATEQUISTA_REGIAO',
      'CATEQUISTA_SETOR',
      'CATEQUISTA_PAROQUIA',
      'SECRETARIA_CNC',
      'SECRETARIA_PAROQUIA',
      'NAO_IDENTIFICADO',
    ]);
    expect(
      Object.values(indicadores.usuarios.porPapel).every(
        (quantidade) => typeof quantidade === 'number',
      ),
    ).toBe(true);
  });

  it(`/${principal} (GET) - 200 | nao deve expor dados pessoais`, async () => {
    const res = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const corpo = JSON.stringify(res.body);
    expect(corpo).not.toContain('cpf');
    expect(corpo).not.toContain('nome');
    expect(corpo).not.toContain('email');
    expect(corpo).not.toContain('whatsapp');
    expect(corpo).not.toContain('cadastradoPorId');
    expect(corpo).not.toContain('atualizadoPorId');
  });

  it(`/${principal} (GET) - 200 | deve retornar os mesmos totais para admin e secretaria`, async () => {
    const resAdmin = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    const resSecretaria = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretaria}`)
      .expect(200);

    expect(resSecretaria.body.data).toEqual(resAdmin.body.data);
  });
});
