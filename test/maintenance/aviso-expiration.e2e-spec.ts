import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from 'src/prisma.service.js';
import { ScheduledJobStatus } from 'src/prisma/generated-client.js';
import { AvisoExpirationJob } from 'src/maintenance/jobs/aviso-expiration.job.js';
import { setupTestModule } from '../test-setup.js';

describe('AvisoExpirationJob (integração e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let job: AvisoExpirationJob;
  let tokenAdmin = '';

  const agora = Date.now();

  beforeAll(async () => {
    app = await setupTestModule();
    prisma = app.get(PrismaService);
    job = app.get(AvisoExpirationJob);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });
    tokenAdmin = response.body.data.access_token;

    await prisma.aviso.deleteMany();
    await prisma.scheduledJobExecution.deleteMany();
  });

  afterAll(async () => {
    await prisma.aviso.deleteMany();
    await prisma.scheduledJobExecution.deleteMany();
    await app.close();
  });

  it('remove avisos vencidos, preserva vigentes e registra a execução no histórico', async () => {
    await prisma.aviso.createMany({
      data: [
        {
          texto: 'Aviso vencido',
          dataFim: new Date(agora - 2 * 24 * 60 * 60 * 1000),
        },
        {
          texto: 'Aviso vigente',
          dataFim: new Date(agora + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    await job.execute();

    const listaPublica = await request(app.getHttpServer())
      .get('/avisos')
      .expect(200);

    const textos = listaPublica.body.data.map(
      (aviso: { texto: string }) => aviso.texto,
    );
    expect(textos).not.toContain('Aviso vencido');
    expect(textos).toContain('Aviso vigente');

    const historico = await request(app.getHttpServer())
      .get('/maintenance/executions')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(historico.body.data).toHaveLength(1);
    expect(historico.body.data[0].jobName).toBe('aviso-expiration');
    expect(historico.body.data[0].status).toBe(ScheduledJobStatus.SUCCESS);
    expect(historico.body.data[0].finishedAt).toBeDefined();
  });

  it('conclui sem erros quando não há avisos vencidos', async () => {
    await prisma.aviso.deleteMany();
    await prisma.scheduledJobExecution.deleteMany();

    await prisma.aviso.create({
      data: {
        texto: 'Aviso futuro',
        dataFim: new Date(agora + 10 * 24 * 60 * 60 * 1000),
      },
    });

    await expect(job.execute()).resolves.toBeUndefined();

    const restantes = await prisma.aviso.findMany();
    expect(restantes.map((aviso) => aviso.texto)).toEqual(['Aviso futuro']);
  });
});
