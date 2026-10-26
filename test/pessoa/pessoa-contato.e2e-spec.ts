import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { pessoaMock } from '../mocks/pessoa-mock.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { mockSaoPedroPessoaService } from '../mocks/sao-pedro-api-mock.js';
import { PrismaService } from 'src/prisma.service.js';

describe('PessoaContatoController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'pessoa';
  let token = '';
  let pessoaId = 0;

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SaoPedroPessoaService,
        value: mockSaoPedroPessoaService,
      },
    ]);
    prisma = app.get(PrismaService);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });
    token = loginResponse.body.data.access_token;

    // Fixture: cria uma pessoa para os testes de contato
    vi.spyOn(mockSaoPedroPessoaService, 'getExternalPessoaByCpf').mockResolvedValue(
      null,
    );
    vi.spyOn(mockSaoPedroPessoaService, 'createExternalPessoa').mockResolvedValue({
      id: 999,
      externalId: `e2e-contato-${Date.now()}`,
      nome: 'Pessoa Contato Mock',
      cpf: '07211100000',
      estadoCivil: 'SOLTEIRO',
      situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
      escolaridade: 'ANALFABETO',
      nacionalidade: 'brasileira',
      sexo: 'FEMININO',
      conhecidoPor: 'Contato',
      foto: null,
      ativo: true,
      dataNascimento: new Date('1990-01-01'),
    });

    const pessoaResponse = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...pessoaMock });

    pessoaId = pessoaResponse.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal}/:id/contato (POST) - 401 | nao pode criar contato se nao tiver autenticado`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .send({ telefoneCelular: '11999999999' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal}/:id/contato (POST) - 403 | nao pode criar contato sem permissao`, async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ronaldinho@admin.com', password: 'admin' });

    const noPermissionToken = loginResponse.body.data.access_token;

    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${noPermissionToken}`)
      .send({ telefoneCelular: '11999999999' })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para create pessoa',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal}/:id/contato (POST) - 404 | nao pode criar contato para pessoa inexistente`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/999999/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ telefoneCelular: '11999999999' })
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Pessoa' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal}/:id/contato (POST) - 400 | nao pode criar contato com email invalido`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'email-invalido' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/${principal}/:id/contato (POST) - 400 | nao pode criar contato com contatoPrincipal de tipo invalido`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contatoPrincipal: 'true' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/${principal}/:id/contato (POST) - 201 | deve criar contato com todos os campos`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        telefoneResidencial: '1122334455',
        telefoneCelular: '11987654321',
        email: 'contato@exemplo.com',
        observacao: 'Contato principal',
        ativo: true,
        contatoPrincipal: false,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('pessoaId', pessoaId);
    expect(response.body.data).toHaveProperty(
      'telefoneResidencial',
      '1122334455',
    );
    expect(response.body.data).toHaveProperty(
      'telefoneCelular',
      '11987654321',
    );
    expect(response.body.data).toHaveProperty('email', 'contato@exemplo.com');
    expect(response.body.data).toHaveProperty('observacao', 'Contato principal');
    expect(response.body.data).toHaveProperty('ativo', true);
    expect(response.body.data).toHaveProperty('contatoPrincipal', false);
  });

  it(`/${principal}/:id/contato (POST) - 201 | deve criar contato so com campos opcionais aplicando defaults`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ telefoneCelular: '11987654321' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('pessoaId', pessoaId);
    expect(response.body.data).toHaveProperty('ativo', true);
    expect(response.body.data).toHaveProperty('contatoPrincipal', false);
  });

  it(`/${principal}/:id/contato (POST) - 201 | deve rebaixar o contato principal anterior ao criar novo principal`, async () => {
    const primeiro = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'primeiro@exemplo.com', contatoPrincipal: true });

    expect(primeiro.status).toBe(201);
    expect(primeiro.body.data).toHaveProperty('contatoPrincipal', true);

    const segundo = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'segundo@exemplo.com', contatoPrincipal: true });

    expect(segundo.status).toBe(201);
    expect(segundo.body.data).toHaveProperty('contatoPrincipal', true);

    const contatos = await prisma.pessoaContato.findMany({
      where: { pessoaId },
    });
    const principais = contatos.filter(
      (contato) => contato.contatoPrincipal === true,
    );

    expect(principais).toHaveLength(1);
    expect(principais[0].email).toBe('segundo@exemplo.com');

    const primeiroPersistido = contatos.find(
      (contato) => contato.email === 'primeiro@exemplo.com',
    );
    expect(primeiroPersistido.contatoPrincipal).toBe(false);
  });
});