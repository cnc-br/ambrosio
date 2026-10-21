import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { PrismaService } from 'src/prisma.service.js';

const ADMIN_PASSWORD_HASH =
  '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC';

describe('ComunidadeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'comunidade';

  const paroquiaDoUsuario = 1;
  const paroquiaForaDoEscopo = 2;

  let tokenAdmin = '';
  let tokenSemPermissao = '';
  let tokenSecretariaCnc = '';
  let tokenSemParoquia = '';
  let comunidadesDaParoquia = 0;
  let totalDeComunidades = 0;

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);

    const semParoquia = await prisma.user.upsert({
      where: { email: 'secretaria-sem-paroquia@admin.com' },
      update: { role: 'SECRETARIA_CNC', active: true },
      create: {
        email: 'secretaria-sem-paroquia@admin.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'SECRETARIA_CNC',
        active: true,
      },
    });

    await prisma.usuarioParoquia.deleteMany({
      where: { userId: semParoquia.id },
    });

    comunidadesDaParoquia = await prisma.comunidade.count({
      where: { paroquiaId: paroquiaDoUsuario },
    });
    totalDeComunidades = await prisma.comunidade.count();

    tokenAdmin = await login('admin@admin.com');
    tokenSemPermissao = await login('ronaldinho@admin.com');
    tokenSecretariaCnc = await login('secretaria@admin.com');
    tokenSemParoquia = await login('secretaria-sem-paroquia@admin.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 401 | nao pode listar comunidades sem autenticacao`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (GET) - 403 | nao pode listar comunidades sem permissao`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para read comunidade',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (GET) - 200 | SECRETARIA_CNC lista apenas comunidades das suas paroquias`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(comunidadesDaParoquia);
        expect(
          res.body.data.every(
            (comunidade) => comunidade.paroquia.id === paroquiaDoUsuario,
          ),
        ).toBe(true);
      });
  });

  it(`/${principal} (GET) - 200 | SECRETARIA_CNC sem paroquia lista vazio`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSemParoquia}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(0);
      });
  });

  it(`/${principal} (GET) - 200 | SECRETARIA_CNC filtra paroquia dentro do escopo`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}?paroquiaId=${paroquiaDoUsuario}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(comunidadesDaParoquia);
        expect(
          res.body.data.every(
            (comunidade) => comunidade.paroquia.id === paroquiaDoUsuario,
          ),
        ).toBe(true);
      });
  });

  it(`/${principal} (GET) - 200 | SECRETARIA_CNC filtra paroquia fora do escopo e recebe vazio`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}?paroquiaId=${paroquiaForaDoEscopo}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(0);
      });
  });

  it(`/${principal} (GET) - 200 | SECRETARIA_CNC filtra numero da comunidade dentro do escopo`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}?numeroDaComunidade=1`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].numeroDaComunidade).toBe(1);
        expect(res.body.data[0].paroquia.id).toBe(paroquiaDoUsuario);
      });
  });

  it(`/${principal} (GET) - 200 | ADMIN lista comunidades de todas as paroquias`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveLength(totalDeComunidades);
      });
  });
});
