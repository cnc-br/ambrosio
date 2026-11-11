import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { pessoaMock } from '../mocks/pessoa-mock.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from '../../test/mocks/sao-pedro-api-mock.js';

const ADMIN_PASSWORD_HASH =
  '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC';

describe('PessoaCreateController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'pessoa';
  let token = '';
  let tokenSecretariaCnc = '';
  let tokenSecretariaSemParoquia = '';
  let pessoaParaAtualizar = 0;
  let adminUserId = '';
  let secretariaCncUserId = '';

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  const externalPessoaMock = (externalId: string, nome: string, cpf: string) => ({
    id: 999,
    externalId,
    nome,
    cpf,
    estadoCivil: 'SOLTEIRO',
    situacaoReligiosa: pessoaMock.situacaoReligiosa,
    escolaridade: 'ANALFABETO',
    nacionalidade: pessoaMock.nacionalidade,
    sexo: 'FEMININO',
    conhecidoPor: 'Teste',
    foto: null,
    ativo: true,
    dataNascimento: new Date('1990-01-01'),
  });

  beforeAll(async () => {
    app = await setupTestModule([
      {
        provider: SaoPedroPessoaService,
        value: mockSaoPedroPessoaService,
      },
      {
        provider: SaoPedroContatoService,
        value: mockSaoPedroContatoService,
      },
    ]);

    prisma = app.get(PrismaService);

    const secretariaSemParoquia = await prisma.user.upsert({
      where: { email: 'secretaria-sem-paroquia-pessoa@admin.com' },
      update: { role: 'SECRETARIA_CNC', active: true },
      create: {
        email: 'secretaria-sem-paroquia-pessoa@admin.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'SECRETARIA_CNC',
        active: true,
      },
    });

    await prisma.usuarioParoquia.deleteMany({
      where: { userId: secretariaSemParoquia.id },
    });

    token = await login('admin@admin.com');
    tokenSecretariaCnc = await login('secretaria@admin.com');
    tokenSecretariaSemParoquia = await login(
      'secretaria-sem-paroquia-pessoa@admin.com',
    );

    adminUserId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: 'admin@admin.com' },
      })
    ).id;
    secretariaCncUserId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: 'secretaria@admin.com' },
      })
    ).id;

    // Fixture de pessoa para os casos de atualização
    const cpfFixture = '10000000108';
    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'createExternalPessoa',
    ).mockResolvedValueOnce(
      externalPessoaMock(
        `e2e-pessoa-upd-${Date.now()}`,
        'Pessoa Fixture Update',
        cpfFixture,
      ),
    );

    const fixtureResponse = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...pessoaMock,
        cpf: cpfFixture,
      });

    pessoaParaAtualizar = fixtureResponse.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 401 | nao pode ver pessoa se nao tiver autenticado`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (POST) - 401 | não pode cadastrar pessoa se não tiver autenticado`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}`)
      .send({
        nome: 'Pessoa Teste',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (POST) - 403 | não pode cadastrar pessoa se não tiver permissão`, async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ronaldinho@admin.com', password: 'admin' });

    const tokenNaoPermitido = response.body.data.access_token;

    return request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenNaoPermitido}`)
      .send({
        ...pessoaMock,
      })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para create pessoa',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (POST) - 201 | deve cadastrar pessoa corretamente`, async () => {
    // Mock específico para este teste
    vi
      .spyOn(mockSaoPedroPessoaService, 'getExternalPessoaByCpf')
      .mockResolvedValueOnce(null);
    // externalId único por execução: evita colisão de @unique (externalId)
    // com linhas de execuções anteriores quando o banco não é resetado
    vi.spyOn(mockSaoPedroPessoaService, 'createExternalPessoa').mockResolvedValue(
      {
        id: 999,
        externalId: `e2e-pessoa-${Date.now()}`,
        nome: 'Carmem Hernandez Mock',
        cpf: pessoaMock.cpf,
        estadoCivil: 'SOLTEIRO',
        situacaoReligiosa: pessoaMock.situacaoReligiosa,
        escolaridade: 'ANALFABETO',
        nacionalidade: 'espanhol',
        sexo: 'FEMININO',
        conhecidoPor: 'Carminha',
        foto: null,
        ativo: true,
        dataNascimento: new Date('1932-02-23'),
      },
    );
    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...pessoaMock,
        cadastradoPorId: 'usuario-forjado',
        atualizadoPorId: 'usuario-forjado',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('nome', 'Carmem Hernandez Mock');
    expect(response.body.data).toHaveProperty('cpf', pessoaMock.cpf);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const pessoaCriada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: response.body.data.id },
    });
    expect(pessoaCriada.cadastradoPorId).toBe(adminUserId);
    expect(pessoaCriada.atualizadoPorId).toBe(adminUserId);
    // expect(response.body.data).toHaveProperty(
    //   'dataNascimento',
    //   pessoaMock.dataNascimento,
    // );
  });

  it(`/${principal} (POST) - 201 | SECRETARIA_CNC cadastra pessoa`, async () => {
    const externalId = `e2e-pessoa-scnc-${Date.now()}`;
    const nome = 'Pessoa Secretaria CNC';
    const cpf = '10000000280';

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'createExternalPessoa',
    ).mockResolvedValueOnce(externalPessoaMock(externalId, nome, cpf));

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('nome', nome);
    expect(response.body.data).toHaveProperty('cpf', cpf);
  });

  it(`/${principal} (POST) - 201 | SECRETARIA_CNC sem paroquia cadastra pessoa`, async () => {
    const externalId = `e2e-pessoa-sp-${Date.now()}`;
    const nome = 'Pessoa Secretaria Sem Paroquia';
    const cpf = '10000000361';

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'createExternalPessoa',
    ).mockResolvedValueOnce(externalPessoaMock(externalId, nome, cpf));

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretariaSemParoquia}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('nome', nome);
    expect(response.body.data).toHaveProperty('cpf', cpf);
  });

  it(`/${principal}/:id (PATCH) - 401 | nao pode atualizar pessoa sem autenticacao`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}/${pessoaParaAtualizar}`)
      .send({ nome: 'Pessoa Atualizada' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal}/:id (PATCH) - 403 | nao pode atualizar pessoa sem permissao`, async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ronaldinho@admin.com', password: 'admin' });

    const tokenNaoPermitido = response.body.data.access_token;

    return request(app.getHttpServer())
      .patch(`/${principal}/${pessoaParaAtualizar}`)
      .set('Authorization', `Bearer ${tokenNaoPermitido}`)
      .send({ nome: 'Pessoa Atualizada' })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para update pessoa',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal}/:id (PATCH) - 200 | SECRETARIA_CNC atualiza pessoa`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaParaAtualizar}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({ nome: 'Pessoa Atualizada pela Secretaria CNC' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id', pessoaParaAtualizar);
    expect(response.body.data).not.toHaveProperty('cadastradoPorId');
    expect(response.body.data).not.toHaveProperty('atualizadoPorId');

    const pessoaAtualizada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaParaAtualizar },
    });
    expect(pessoaAtualizada.atualizadoPorId).toBe(secretariaCncUserId);
  });

  it(`/${principal}/:id (PATCH) - 200 | ADMIN atualiza pessoa`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaParaAtualizar}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Pessoa Atualizada pelo Admin' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id', pessoaParaAtualizar);

    const pessoaAtualizada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaParaAtualizar },
    });
    expect(pessoaAtualizada.atualizadoPorId).toBe(adminUserId);
  });

  it(`/${principal}/999999 (PATCH) - 404 | nao atualiza pessoa inexistente`, () => {
    return request(app.getHttpServer())
      .patch(`/${principal}/999999`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Pessoa Inexistente' })
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          "O registro de 'Pessoa' não foi encontrado.",
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (POST) - 201 | SECRETARIA_CNC cadastra pessoa e vincula à comunidade da própria paróquia`, async () => {
    const comunidade = await prisma.comunidade.findFirst({
      where: { paroquiaId: 1 },
    });
    expect(comunidade).toBeDefined();

    const cpf = '10000000442';
    const nome = 'Pessoa Vinculada a Comunidade';
    const externalId = `e2e-pessoa-vinc-${Date.now()}`;

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'createExternalPessoa',
    ).mockResolvedValueOnce(externalPessoaMock(externalId, nome, cpf));

    const response = await request(app.getHttpServer())
      .post(`/${principal}?comunidadeId=${comunidade.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');

    const vinculo = await prisma.comunidadePessoa.findUnique({
      where: {
        comunidadeId_pessoaId: {
          comunidadeId: comunidade.id,
          pessoaId: response.body.data.id,
        },
      },
    });
    expect(vinculo).toBeDefined();
  });

  it(`/${principal} (POST) - 403 | SECRETARIA_CNC não vincula pessoa a comunidade fora do escopo, sem criar a pessoa`, async () => {
    let comunidadeForaDoEscopo = await prisma.comunidade.findFirst({
      where: { paroquiaId: 2 },
    });

    if (!comunidadeForaDoEscopo) {
      const maxNumero = await prisma.comunidade.aggregate({
        _max: { numeroDaComunidade: true },
      });
      comunidadeForaDoEscopo = await prisma.comunidade.create({
        data: {
          paroquiaId: 2,
          numeroDaComunidade: (maxNumero._max.numeroDaComunidade ?? 0) + 1,
          quantidadeMembros: 1,
        },
      });
    }

    const chamadasExternasAntes =
      mockSaoPedroPessoaService.createExternalPessoa.mock.calls.length;
    const cpf = '10000000523';

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .post(`/${principal}?comunidadeId=${comunidadeForaDoEscopo.id}`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(
      mockSaoPedroPessoaService.createExternalPessoa.mock.calls.length,
    ).toBe(chamadasExternasAntes);
  });

  it(`/${principal} (POST) - 404 | comunidadeId inexistente não cria pessoa`, async () => {
    const chamadasExternasAntes =
      mockSaoPedroPessoaService.createExternalPessoa.mock.calls.length;
    const cpf = '10000000604';

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);

    const response = await request(app.getHttpServer())
      .post(`/${principal}?comunidadeId=999999`)
      .set('Authorization', `Bearer ${tokenSecretariaCnc}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(404);
    expect(response.body.statusCode).toBe(404);
    expect(
      mockSaoPedroPessoaService.createExternalPessoa.mock.calls.length,
    ).toBe(chamadasExternasAntes);
  });

  it(`/${principal} (POST) - 406 | comunidadeId não numérico`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}?comunidadeId=abc`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...pessoaMock,
      })
      .expect(406)
      .expect((res) => {
        expect(res.body.statusCode).toBe(406);
      });
  });

  it(`/${principal} (POST) - 201 | cadastro sem comunidadeId não cria vínculo`, async () => {
    const cpf = '10000000795';
    const nome = 'Pessoa Sem Vinculo';
    const externalId = `e2e-pessoa-svinc-${Date.now()}`;

    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoaByCpf',
    ).mockResolvedValueOnce(null);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'createExternalPessoa',
    ).mockResolvedValueOnce(externalPessoaMock(externalId, nome, cpf));

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...pessoaMock,
        cpf,
      });

    expect(response.status).toBe(201);

    const vinculos = await prisma.comunidadePessoa.findMany({
      where: { pessoaId: response.body.data.id },
    });
    expect(vinculos).toHaveLength(0);
  });
});
