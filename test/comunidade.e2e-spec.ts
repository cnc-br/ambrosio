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

  it(`/${principal} (POST) - 201 | SECRETARIA_CNC cadastra comunidade na propria paroquia`, async () => {
    const numerosUsados = await prisma.comunidade.findMany({
      where: { paroquiaId: paroquiaDoUsuario },
      select: { numeroDaComunidade: true },
    });
    const numeroLivre = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (n) => !numerosUsados.some((c) => c.numeroDaComunidade === n),
    );

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({
        numeroDaComunidade: numeroLivre,
        quantidadeMembros: 10,
        paroquiaId: paroquiaDoUsuario,
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.paroquia.id).toBe(paroquiaDoUsuario);
  });

  it(`/${principal} (POST) - 403 | SECRETARIA_CNC nao cadastra comunidade fora das suas paroquias`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({
        numeroDaComunidade: 20,
        quantidadeMembros: 10,
        paroquiaId: paroquiaForaDoEscopo,
      })
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (POST) - 404 | SECRETARIA_CNC nao cadastra comunidade com paroquia inexistente`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({
        numeroDaComunidade: 21,
        quantidadeMembros: 10,
        paroquiaId: 987654,
      })
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Paroquia' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal}/:id (PATCH) - 200 | SECRETARIA_CNC atualiza comunidade da propria paroquia`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaDoUsuario },
    });

    return request(app.getHttpServer())
      .patch(`/${principal}/${comunidade.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({ quantidadeMembros: 25 })
      .expect(200);
  });

  it(`/${principal}/:id (PATCH) - 403 | SECRETARIA_CNC nao atualiza comunidade fora das suas paroquias`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaForaDoEscopo },
    });

    return request(app.getHttpServer())
      .patch(`/${principal}/${comunidade.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({ quantidadeMembros: 25 })
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal}/999999 (PATCH) - 404 | nao atualiza comunidade inexistente`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}/999999`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .set('Content-Type', 'application/json')
      .send({ quantidadeMembros: 25 })
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Comunidade' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (POST) - 201 | ADMIN cadastra comunidade em qualquer paroquia`, async () => {
    const numerosUsados = await prisma.comunidade.findMany({
      where: { paroquiaId: paroquiaForaDoEscopo },
      select: { numeroDaComunidade: true },
    });
    const numeroLivre = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (n) => !numerosUsados.some((c) => c.numeroDaComunidade === n),
    );

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('Content-Type', 'application/json')
      .send({
        numeroDaComunidade: numeroLivre,
        quantidadeMembros: 10,
        paroquiaId: paroquiaForaDoEscopo,
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.paroquia.id).toBe(paroquiaForaDoEscopo);
  });

  it(`/${principal}/:id (PATCH) - 200 | ADMIN atualiza comunidade de qualquer paroquia`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaForaDoEscopo },
    });

    return request(app.getHttpServer())
      .patch(`/${principal}/${comunidade.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('Content-Type', 'application/json')
      .send({ quantidadeMembros: 30 })
      .expect(200);
  });

  it(`/${principal}/:id/pessoa/:pessoaId (POST) - 201 | SECRETARIA_CNC adiciona pessoa em comunidade da propria paroquia`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaDoUsuario },
    });
    const vinculadas = await prisma.comunidadePessoa.findMany({
      where: { comunidadeId: comunidade.id },
      select: { pessoaId: true },
    });
    const pessoa = await prisma.pessoa.findFirst({
      where: { id: { notIn: vinculadas.map((v) => v.pessoaId) } },
      select: { id: true },
    });
    expect(pessoa).toBeDefined();

    await request(app.getHttpServer())
      .post(`/${principal}/${comunidade.id}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(201);

    // Cleanup: desfaz o vínculo criado pelo teste
    await request(app.getHttpServer())
      .delete(`/${principal}/${comunidade.id}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);
  });

  it(`/${principal}/:id/pessoa/:pessoaId (POST) - 403 | SECRETARIA_CNC nao adiciona pessoa em comunidade fora das suas paroquias`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaForaDoEscopo },
    });
    const pessoa = await prisma.pessoa.findFirst({ select: { id: true } });

    return request(app.getHttpServer())
      .post(`/${principal}/${comunidade.id}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal}/:id/pessoa/:pessoaId (DELETE) - 403 | SECRETARIA_CNC nao remove pessoa em comunidade fora das suas paroquias`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: paroquiaForaDoEscopo },
    });
    const pessoa = await prisma.pessoa.findFirst({ select: { id: true } });

    return request(app.getHttpServer())
      .delete(`/${principal}/${comunidade.id}/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });
});
