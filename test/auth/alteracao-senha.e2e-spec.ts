import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { UserRoleEnum } from 'neocatecumenal';
import { setupTestModule } from '../test-setup.js';
import { PrismaService } from 'src/prisma.service.js';
import { SendEmailService } from 'src/external/send-email/send-email.service.js';

describe('AlteracaoSenha (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sendEmailMock = {
    sendRecoveryEmail: vi.fn(),
  };

  const emailNaoAdmin = 'e2e-senha-nao-admin@admin.com';
  const emailRecuperacao = 'e2e-senha-recuperacao@admin.com';
  const emailInexistente = 'e2e-senha-inexistente@admin.com';
  const senhaAtual = 'senha-atual';
  const novaSenha = 'senha-nova';
  const hashInicial =
    '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC';

  let tokenNaoAdmin = '';
  let userIdNaoAdmin = '';

  const login = (email: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email, password });

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SendEmailService,
        value: sendEmailMock,
      },
    ]);
    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [emailNaoAdmin, emailRecuperacao, emailInexistente],
        },
      },
    });

    const usuarioNaoAdmin = await prisma.user.create({
      data: {
        email: emailNaoAdmin,
        password: await bcrypt.hash(senhaAtual, 10),
        role: UserRoleEnum.SECRETARIA_CNC,
        active: true,
      },
    });
    userIdNaoAdmin = usuarioNaoAdmin.id;

    await prisma.user.create({
      data: {
        email: emailRecuperacao,
        password: hashInicial,
        role: UserRoleEnum.NAO_IDENTIFICADO,
        active: true,
      },
    });

    const loginResponse = await login(emailNaoAdmin, senhaAtual);
    tokenNaoAdmin = loginResponse.body.data.access_token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [emailNaoAdmin, emailRecuperacao, emailInexistente],
        },
      },
    });
    await app.close();
  });

  beforeEach(() => {
    sendEmailMock.sendRecoveryEmail.mockClear();
  });

  it('/auth/change-password (POST) - 401 | bloqueia troca sem autenticação', () => {
    return request(app.getHttpServer())
      .post('/auth/change-password')
      .send({ currentPassword: senhaAtual, newPassword: novaSenha })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it('/auth/change-password (POST) - 401 | rejeita senha atual incorreta sem alterar a senha', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${tokenNaoAdmin}`)
      .send({ currentPassword: 'senha-errada', newPassword: novaSenha });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Senha atual incorreta.');

    const loginComSenhaOriginal = await login(emailNaoAdmin, senhaAtual);
    expect(loginComSenhaOriginal.status).toBe(201);
  });

  it('/auth/change-password (POST) - 200 | permite que usuário não-ADMIN troque a própria senha', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${tokenNaoAdmin}`)
      .send({ currentPassword: senhaAtual, newPassword: novaSenha });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      message: 'Senha alterada com sucesso.',
    });

    const loginComNovaSenha = await login(emailNaoAdmin, novaSenha);
    expect(loginComNovaSenha.status).toBe(201);
    expect(loginComNovaSenha.body.data.access_token).toBeDefined();

    const loginComSenhaAntiga = await login(emailNaoAdmin, senhaAtual);
    expect(loginComSenhaAntiga.status).toBe(401);
  });

  it('/auth/forgot-password (POST) - 201 | define senha temporária para usuário não-ADMIN', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: emailRecuperacao });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      message: 'Email de recuperação enviado se o usuário existir.',
    });
    expect(sendEmailMock.sendRecoveryEmail).toHaveBeenCalledWith(
      emailRecuperacao,
      expect.stringContaining('/reset-password?token='),
      expect.any(String),
    );

    const usuario = await prisma.user.findUniqueOrThrow({
      where: { email: emailRecuperacao },
    });
    expect(usuario.password).not.toBe(hashInicial);
    expect(usuario.resetPasswordToken).not.toBeNull();
    expect(usuario.resetPasswordExpires).not.toBeNull();
  });

  it('/auth/forgot-password (POST) - 201 | responde genericamente para email inexistente', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: emailInexistente });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      message: 'Email de recuperação enviado se o usuário existir.',
    });
    expect(sendEmailMock.sendRecoveryEmail).not.toHaveBeenCalled();
  });

  it('/users/:id (PATCH) - 403 | usuário não-ADMIN não edita a própria conta', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userIdNaoAdmin}`)
      .set('Authorization', `Bearer ${tokenNaoAdmin}`)
      .send({ whatsapp: '16999887766' });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      message: 'Você não tem permissão para update user',
      statusCode: 403,
    });
  });
});
