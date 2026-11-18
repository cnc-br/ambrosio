import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { PrismaService } from 'src/prisma.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { mockSaoPedroPessoaService } from './mocks/sao-pedro-api-mock.js';

describe('EquipeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'equipe';

  let tokenAdmin = '';
  let adminUserId = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SaoPedroPessoaService,
        value: mockSaoPedroPessoaService,
      },
    ]);
    prisma = app.get(PrismaService);

    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@admin.com' },
    });
    adminUserId = admin.id;
    tokenAdmin = await login('admin@admin.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (POST) - 401 | nao pode criar equipe sem autenticacao`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .send({ descricao: 'Equipe sem token', tipoEquipeId: 1 })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
      });
  });

  it(`/${principal} (POST) - 201 | registra o usuário autenticado e não expõe auditoria`, async () => {
    const tipoEquipe = await prisma.tipoEquipe.findFirstOrThrow();
    const pessoa = await prisma.pessoa.findFirstOrThrow({ select: { id: true } });

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        descricao: `Equipe auditoria e2e ${Date.now()}`,
        tipoEquipeId: tipoEquipe.id,
        pessoas: [{ id: pessoa.id }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criada = await prisma.equipe.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criada.cadastradoPorId).toBe(adminUserId);
    expect(criada.atualizadoPorId).toBe(adminUserId);

    const vinculo = await prisma.equipePessoa.findFirstOrThrow({
      where: { equipeId: criada.id, pessoaId: pessoa.id },
    });
    expect(vinculo.cadastradoPorId).toBe(adminUserId);
    expect(vinculo.atualizadoPorId).toBe(adminUserId);
  });

  it(`/${principal}/:id (PATCH) - 200 | registra o usuário autenticado em atualizadoPorId`, async () => {
    const tipoEquipe = await prisma.tipoEquipe.findFirstOrThrow();
    const criada = await prisma.equipe.create({
      data: {
        descricao: `Equipe update e2e ${Date.now()}`,
        tipoEquipeId: tipoEquipe.id,
      },
    });

    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${criada.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        descricao: `Equipe atualizada e2e ${Date.now()}`,
        tipoEquipeId: tipoEquipe.id,
        pessoas: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const atualizada = await prisma.equipe.findUniqueOrThrow({
      where: { id: criada.id },
    });
    expect(atualizada.atualizadoPorId).toBe(adminUserId);
  });
});
