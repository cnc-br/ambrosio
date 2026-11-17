import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { PrismaService } from 'src/prisma.service.js';

describe('LocalidadeController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'localidade';

  let tokenAdmin = '';
  let adminUserId = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  beforeAll(async () => {
    app = await setupTestModule();
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

  it(`/${principal} (POST) - 401 | nao pode criar localidade sem autenticacao`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .send({ descricao: 'Sem token' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
      });
  });

  it(`/${principal} (POST) - 201 | registra o usuário autenticado na localidade e no endereço`, async () => {
    const diocese = await prisma.diocese.findFirstOrThrow();
    const tipoLocalidade = await prisma.tipoLocalidade.findFirstOrThrow();

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        descricao: `Localidade auditoria e2e ${Date.now()}`,
        diocese: { id: diocese.id, descricao: diocese.descricao },
        tipoLocalidade: {
          id: tipoLocalidade.id,
          descricao: tipoLocalidade.descricao,
        },
        endereco: {
          cep: '13208200',
          logradouro: 'Rua Auditoria',
          numero: '100',
          bairro: 'Centro',
          UF: 'SP',
          cidade: 'Judiaí',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const criada = await prisma.localidade.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(criada.cadastradoPorId).toBe(adminUserId);
    expect(criada.atualizadoPorId).toBe(adminUserId);

    const endereco = await prisma.endereco.findUniqueOrThrow({
      where: { id: criada.enderecoId },
    });
    expect(endereco.cadastradoPorId).toBe(adminUserId);
    expect(endereco.atualizadoPorId).toBe(adminUserId);
  });
});
