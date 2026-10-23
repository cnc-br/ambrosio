import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { setupTestModule } from '../test-setup.js';
import { PrismaService } from 'src/prisma.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { mockSaoPedroPessoaService } from '../../test/mocks/sao-pedro-api-mock.js';
import { UserRoleEnum } from 'neocatecumenal';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
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
    prisma = app.get(PrismaService);

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

  it('/users/45 (DELETE) - 401 | nao pode excluir usuario sem autenticacao', () => {
    return request(app.getHttpServer())
      .delete('/users/45')
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/users/45 (DELETE) - 403 | nao pode excluir usuario sem permissao', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ronaldinho@admin.com', password: 'admin' });

    const tokenNaoPermitido = response.body.data.access_token;

    return request(app.getHttpServer())
      .delete('/users/45')
      .set('Authorization', `Bearer ${tokenNaoPermitido}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para delete user',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it('/users/usuario-inexistente (DELETE) - 404 | nao pode excluir usuario inexistente', () => {
    return request(app.getHttpServer())
      .delete('/users/usuario-inexistente')
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Usuário' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it('/users/:id (DELETE) - 204 | exclui usuario sem corpo e remove vinculos usuario-paroquia', async () => {
    const deleteEmail = 'usuario-delete@admin.com';
    const deleteCpf = '74147855632';

    // Pessoa 2 do seed (externalId id-usuario-cpf-duplicado-e2e-2), sem usuário vinculado
    vi
      .spyOn(mockSaoPedroPessoaService, 'getExternalPessoaByCpf')
      .mockResolvedValueOnce({
        id: 2,
        externalId: 'id-usuario-cpf-duplicado-e2e-2',
        nome: 'Pessoa Delete Mock',
        cpf: deleteCpf,
        ativo: true,
      });

    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: deleteEmail,
        cpf: deleteCpf,
        password: 'admin',
        whatsapp,
      })
      .expect(201);

    const userId = created.body.data.id;

    await request(app.getHttpServer())
      .patch(`/users/${userId}/paroquias`)
      .set('Authorization', `Bearer ${token}`)
      .send({ paroquiaIds: [1] })
      .expect(200);

    const vinculosAntes = await prisma.usuarioParoquia.count({
      where: { userId },
    });
    expect(vinculosAntes).toBeGreaterThan(0);

    const deleted = await request(app.getHttpServer())
      .delete(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(deleted.body).toEqual({});

    await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const vinculosDepois = await prisma.usuarioParoquia.count({
      where: { userId },
    });
    expect(vinculosDepois).toBe(0);

    // Preservação da pessoa vinculada (pessoa id 2 do seed)
    const pessoaPreservada = await prisma.pessoa.findUnique({
      where: { id: 2 },
    });
    expect(pessoaPreservada).toBeDefined();
  });
});
