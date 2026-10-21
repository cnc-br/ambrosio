import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { setupTestModule } from '../test-setup.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { mockSaoPedroPessoaService } from '../../test/mocks/sao-pedro-api-mock.js';
import { UserRoleEnum } from 'neocatecumenal';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const email = 'carmem@neocatecumenal.com.es';
  const cpf = '11122233345';
  const password = faker.internet.password();
  const whatsapp = '16999999999';
  let token = '';
  let createdUserId = '';

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SaoPedroPessoaService,
        value: mockSaoPedroPessoaService,
      },
    ]);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });

    token = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) - 401 | bloquear get users sem autenticacao', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/users/1 (GET) - 401 | bloquear get users by id sem autenticacao', () => {
    return request(app.getHttpServer())
      .get('/users/45')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/users/me (GET) - 200 | retorna o usuario autenticado com a role', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      email: 'admin@admin.com',
      role: UserRoleEnum.ADMIN,
    });
  });

  it('/users (POST) - 201 | Deve criar um usuário com sucesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        cpf,
        password,
        whatsapp,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      server: '127.0.0.1/users',
      page: 1,
      limit: 1,
      data: {
        email,
        whatsapp,
        verifiedWhatsapp: false,
      },
    });

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('password');
    expect(response.body.data).toHaveProperty('verifiedWhatsapp');
    expect(response.body.data).toHaveProperty(
      'role',
      UserRoleEnum.NAO_IDENTIFICADO,
    );
    expect(response.body.data).toHaveProperty('active', false);
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data).toHaveProperty('updatedAt');
    expect(typeof response.body.data.password).toBe('string');
    expect(typeof response.body.data.verifiedWhatsapp).toBe('boolean');

    createdUserId = response.body.data.id;
  });

  it('/users/:id (GET) - 200 | retorna o usuário no contrato User, sem dados sensíveis', async () => {
    const response = await request(app.getHttpServer())
      .get(`/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: createdUserId,
      email,
      whatsapp,
      verifiedWhatsapp: false,
      active: false,
      role: UserRoleEnum.NAO_IDENTIFICADO,
    });
    expect(response.body.data).toHaveProperty('createdAt');
    expect(response.body.data.paroquias).toEqual([]);
    expect(response.body.data).not.toHaveProperty('password');
    expect(response.body.data).not.toHaveProperty('resetPasswordToken');
    expect(response.body.data).not.toHaveProperty('resetPasswordExpires');

    // usuário criado via CPF tem pessoa vinculada, serializada pelo contrato Pessoa
    expect(response.body.data.pessoa).toBeDefined();
    expect(response.body.data.pessoa.nome).toBeDefined();
    expect(response.body.data.pessoa.cpf).toBeDefined();
    expect(response.body.data.pessoa.externalId).toBeDefined();
  });

  it('/users (POST) - 400 | Não deve permitir e-mail duplicado', async () => {
    // Mock específico para esse teste
    vi
      .spyOn(mockSaoPedroPessoaService, 'getExternalPessoaByCpf')
      .mockResolvedValueOnce({
        id: 3,
        externalId: 'id-usuario-cpf-duplicado-e2e-2',
        nome: 'Outra Pessoa Mock',
        cpf: '74147855632',
        ativo: true,
      });

    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        cpf: '74147855632',
        password: 'admin',
        whatsapp,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toContain(
      `O campo 'email' já existe cadastrado. Não permitimos duplicidade.`,
    );
  });

  it('/users (POST) - 409 | Não deve permitir CPF duplicado', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        cpf,
        password: 'admin',
        whatsapp,
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toContain(
      `Já tem um usuario com esse ID: 1 - Email: carmem@neocatecumenal.com.es`,
    );
  });

  it('/auth/login (POST) - 201 | Autenticar o usuario com sucesso', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });

    expect(response.status).toBe(201);
    expect(response.body.data.access_token).toBeDefined();
    expect(response.body.data.access_token_type).toBeDefined();
  });
});
