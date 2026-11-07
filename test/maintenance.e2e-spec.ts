import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { PrismaService } from 'src/prisma.service.js';
import { ScheduledJobStatus } from 'src/prisma/generated-client.js';

describe('MaintenanceController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'maintenance/executions';

  let tokenAdmin = '';
  let tokenSemPermissao = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);

    tokenAdmin = await login('admin@admin.com');
    tokenSemPermissao = await login('ronaldinho@admin.com');
  });

  afterAll(async () => {
    await prisma.scheduledJobExecution.deleteMany();
    await app.close();
  });

  it(`/${principal} (GET) - 401 | nao pode listar historico sem autenticacao`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (DELETE) - 401 | nao pode excluir historico sem autenticacao`, () => {
    return request(app.getHttpServer())
      .delete(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (GET) - 403 | nao pode listar historico sem papel ADMIN`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (DELETE) - 403 | nao pode excluir historico sem papel ADMIN`, () => {
    return request(app.getHttpServer())
      .delete(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSemPermissao}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (GET) - 200 | lista historico paginado do mais recente para o mais antigo`, async () => {
    await prisma.scheduledJobExecution.deleteMany();

    const agora = Date.now();
    await prisma.scheduledJobExecution.createMany({
      data: [
        {
          jobName: 'job-mais-antigo',
          status: ScheduledJobStatus.SUCCESS,
          startedAt: new Date(agora - 2 * 60 * 60 * 1000),
        },
        {
          jobName: 'job-intermediario',
          status: ScheduledJobStatus.FAILED,
          startedAt: new Date(agora - 60 * 60 * 1000),
        },
        {
          jobName: 'job-mais-recente',
          status: ScheduledJobStatus.SUCCESS,
          startedAt: new Date(agora),
        },
      ],
    });

    const primeiraPagina = await request(app.getHttpServer())
      .get(`/${principal}?page=1&limit=2`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(primeiraPagina.body).toHaveProperty('server');
    expect(primeiraPagina.body).toHaveProperty('total');
    expect(primeiraPagina.body).toHaveProperty('page', 1);
    expect(primeiraPagina.body).toHaveProperty('limit', 2);
    expect(primeiraPagina.body.data).toHaveLength(2);
    expect(primeiraPagina.body.data[0].jobName).toBe('job-mais-recente');
    expect(primeiraPagina.body.data[1].jobName).toBe('job-intermediario');

    const segundaPagina = await request(app.getHttpServer())
      .get(`/${principal}?page=2&limit=2`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(segundaPagina.body).toHaveProperty('page', 2);
    expect(segundaPagina.body.data).toHaveLength(1);
    expect(segundaPagina.body.data[0].jobName).toBe('job-mais-antigo');
  });

  it(`/${principal} (DELETE) - 200 | exclui somente execucoes concluidas e preserva RUNNING`, async () => {
    await prisma.scheduledJobExecution.deleteMany();
    const totalComunidades = await prisma.comunidade.count();

    const agora = Date.now();
    await prisma.scheduledJobExecution.createMany({
      data: [
        {
          jobName: 'job-concluido',
          status: ScheduledJobStatus.SUCCESS,
          startedAt: new Date(agora - 2_000),
          finishedAt: new Date(agora - 1_000),
          durationMs: 1_000,
        },
        {
          jobName: 'job-com-falha',
          status: ScheduledJobStatus.FAILED,
          startedAt: new Date(agora - 2_000),
          finishedAt: new Date(agora - 1_000),
          durationMs: 1_000,
          error: 'erro de teste',
        },
        {
          jobName: 'job-em-andamento',
          status: ScheduledJobStatus.RUNNING,
          startedAt: new Date(agora),
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .delete(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(response.body.data).toEqual({ deleted: 2 });

    const restantes = await prisma.scheduledJobExecution.findMany();
    expect(restantes).toHaveLength(1);
    expect(restantes[0].jobName).toBe('job-em-andamento');
    expect(restantes[0].status).toBe(ScheduledJobStatus.RUNNING);

    expect(await prisma.comunidade.count()).toBe(totalComunidades);
  });
});
