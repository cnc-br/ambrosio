/* eslint-disable @typescript-eslint/no-explicit-any */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from '../mocks/sao-pedro-api-mock.js';

const ADMIN_PASSWORD_HASH =
  '$2b$10$.TT7jgY.IqTW/3qg9RXw4.y20H4ROVqfj0TIjBi5l9ks2fb5ueQsC';

describe('PessoaUpdateScope (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const principal = 'pessoa';

  let tokenAdmin = '';
  let tokenSecretaria1 = '';
  let tokenSecretaria2 = '';

  let adminUserId = '';
  let secretaria1UserId = '';
  let secretaria2UserId = '';

  let pessoaPropria: { id: number; externalId: string };
  let pessoaOutra: { id: number; externalId: string };
  let pessoaSemVinculo: { id: number; externalId: string };
  let pessoaVinculoEncerrado: { id: number; externalId: string };
  let pessoaPropriaETerceira: { id: number; externalId: string };
  let pessoaCasal1: { id: number; externalId: string };
  let pessoaCasal2: { id: number; externalId: string };

  const externalPessoas = new Map<string, any>();
  const externalPessoasList: any[] = [];

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  const externalPessoaMock = (
    externalId: string,
    nome: string,
    sexo: 'M' | 'F',
    estadoCivil = 'C',
  ) => ({
    id: 1,
    externalId,
    nome,
    cpf: '12345678901',
    estadoCivil,
    situacaoReligiosa: { id: 1, descricao: 'LEIGO' },
    escolaridade: 'ANALFABETO',
    nacionalidade: 'brasileira',
    sexo,
    conhecidoPor: nome,
    foto: null,
    ativo: true,
    dataNascimento: new Date('1990-01-01'),
  });

  const criarPessoa = async (
    externalId: string,
    nome: string,
    sexo: 'M' | 'F',
  ) => {
    const external = externalPessoaMock(externalId, nome, sexo);
    externalPessoas.set(externalId, external);
    externalPessoasList.push(external);

    return prisma.pessoa.create({
      data: {
        externalId,
        situacaoReligiosaId: 1,
        cadastradoPorId: adminUserId,
        atualizadoPorId: adminUserId,
      },
    });
  };

  const criarVinculo = async (
    pessoaId: number,
    comunidadeId: number,
    dataSaida: Date | null = null,
  ) => {
    await prisma.comunidadePessoa.create({
      data: {
        pessoaId,
        comunidadeId,
        dataEntrada: new Date(),
        dataSaida,
      },
    });
  };

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

    adminUserId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: 'admin@admin.com' },
      })
    ).id;

    secretaria1UserId = (
      await prisma.user.findUniqueOrThrow({
        where: { email: 'secretaria@admin.com' },
      })
    ).id;

    const secretaria2 = await prisma.user.upsert({
      where: { email: 'secretaria2@admin.com' },
      update: { role: 'SECRETARIA_CNC', active: true },
      create: {
        email: 'secretaria2@admin.com',
        password: ADMIN_PASSWORD_HASH,
        role: 'SECRETARIA_CNC',
        active: true,
      },
    });
    secretaria2UserId = secretaria2.id;

    await prisma.usuarioParoquia.upsert({
      where: {
        userId_paroquiaId: {
          userId: secretaria2UserId,
          paroquiaId: 2,
        },
      },
      update: {},
      create: {
        userId: secretaria2UserId,
        paroquiaId: 2,
      },
    });

    tokenAdmin = await login('admin@admin.com');
    tokenSecretaria1 = await login('secretaria@admin.com');
    tokenSecretaria2 = await login('secretaria2@admin.com');

    const comunidade1 = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: 1 },
    });
    const comunidade1b = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: 1, id: { not: comunidade1.id } },
    });
    const comunidade2 = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: 2 },
    });

    // Pessoas externas já existentes no seed (para a listagem de todas as pessoas)
    const seedExternal = [
      externalPessoaMock(
        'id-usuario-teste-e2e-1',
        'Pessoa Carismatica Mock',
        'F',
      ),
      externalPessoaMock(
        'id-usuario-cpf-duplicado-e2e-2',
        'Pessoa Duplicada Mock',
        'F',
      ),
    ];
    seedExternal.forEach((external) => {
      externalPessoas.set(external.externalId, external);
      externalPessoasList.push(external);
    });

    pessoaPropria = await criarPessoa(
      'e2e-scope-propria-1',
      'Pessoa Propria',
      'M',
    );
    await criarVinculo(pessoaPropria.id, comunidade1.id);

    pessoaOutra = await criarPessoa(
      'e2e-scope-outra-1',
      'Pessoa Outra',
      'F',
    );
    await criarVinculo(pessoaOutra.id, comunidade2.id);

    pessoaSemVinculo = await criarPessoa(
      'e2e-scope-sem-vinculo-1',
      'Pessoa Sem Vinculo',
      'M',
    );

    pessoaVinculoEncerrado = await criarPessoa(
      'e2e-scope-encerrado-1',
      'Pessoa Encerrada',
      'M',
    );
    await criarVinculo(
      pessoaVinculoEncerrado.id,
      comunidade1.id,
      new Date(),
    );

    pessoaPropriaETerceira = await criarPessoa(
      'e2e-scope-propria-terceira-1',
      'Pessoa Propria Terceira',
      'M',
    );
    await criarVinculo(pessoaPropriaETerceira.id, comunidade1.id);
    await criarVinculo(pessoaPropriaETerceira.id, comunidade2.id);

    // Pessoas para GET /pessoa/conjugue (sem casal)
    await criarPessoa('e2e-scope-conjugue-1', 'Conjugue 1', 'M').then(
      (pessoa) => criarVinculo(pessoa.id, comunidade1.id),
    );
    await criarPessoa('e2e-scope-conjugue-2', 'Conjugue 2', 'F').then(
      (pessoa) => criarVinculo(pessoa.id, comunidade2.id),
    );
    await criarPessoa('e2e-scope-conjugue-3', 'Conjugue 3', 'M').then(
      (pessoa) =>
        Promise.all([
          criarVinculo(pessoa.id, comunidade1.id),
          criarVinculo(pessoa.id, comunidade2.id),
        ]),
    );

    // Pessoas para POST /pessoa/casal
    pessoaCasal1 = await criarPessoa('e2e-scope-casal-1', 'Casal 1', 'M');
    await criarVinculo(pessoaCasal1.id, comunidade1.id);
    pessoaCasal2 = await criarPessoa('e2e-scope-casal-2', 'Casal 2', 'F');
    await criarVinculo(pessoaCasal2.id, comunidade1b.id);

    vi.spyOn(mockSaoPedroPessoaService, 'findAllPessoas').mockImplementation(
      () => Promise.resolve(externalPessoasList),
    );
    vi.spyOn(
      mockSaoPedroPessoaService,
      'findExternalPessoaByUuid',
    ).mockImplementation((uuid: string) =>
      Promise.resolve(externalPessoas.get(uuid)),
    );
    vi.spyOn(
      mockSaoPedroPessoaService,
      'getExternalPessoasEstadoCivilCasado',
    ).mockImplementation(() => Promise.resolve(externalPessoasList));
    vi.spyOn(
      mockSaoPedroPessoaService,
      'updateExternalPessoa',
    ).mockResolvedValue({} as never);
    vi.spyOn(mockSaoPedroContatoService, 'createExternalContato').mockResolvedValue(
      {
        id: 1,
        pessoaId: 1,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        contatoPrincipal: true,
      } as never,
    );
    vi.spyOn(mockSaoPedroContatoService, 'updateExternalContato').mockResolvedValue(
      {
        id: 1,
        pessoaId: 1,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        contatoPrincipal: true,
      } as never,
    );
    vi.spyOn(
      mockSaoPedroContatoService,
      'findExternalContatos',
    ).mockResolvedValue([]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`${principal} (GET) - SECRETARIA_CNC da paróquia 1 lista todas as pessoas`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(5);
    expect(response.body.data.map((p: any) => p.id)).toEqual(
      expect.arrayContaining([pessoaPropria.id, pessoaOutra.id]),
    );
  });

  it(`${principal} (GET) - SECRETARIA_CNC da paróquia 2 lista todas as pessoas`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenSecretaria2}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((p: any) => p.id)).toEqual(
      expect.arrayContaining([pessoaPropria.id, pessoaOutra.id]),
    );
  });

  it(`${principal}/:id (GET) - SECRETARIA_CNC da paróquia 1 detalha pessoa de outra paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(pessoaOutra.id);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC atualiza pessoa da própria paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Propria Atualizada' });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(pessoaPropria.id);

    const atualizada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaPropria.id },
    });
    expect(atualizada.atualizadoPorId).toBe(secretaria1UserId);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC da paróquia 1 não atualiza pessoa de outra paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Outra Atualizada' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC da paróquia 2 atualiza pessoa da própria paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria2}`)
      .send({ nome: 'Pessoa Outra Atualizada' });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(pessoaOutra.id);

    const atualizada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaOutra.id },
    });
    expect(atualizada.atualizadoPorId).toBe(secretaria2UserId);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC da paróquia 2 não atualiza pessoa de outra paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria2}`)
      .send({ nome: 'Pessoa Propria Atualizada' });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC atualiza pessoa sem vínculo ativo`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaSemVinculo.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Sem Vinculo Atualizada' });

    expect(response.status).toBe(200);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC atualiza pessoa com vínculo apenas encerrado`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaVinculoEncerrado.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Encerrada Atualizada' });

    expect(response.status).toBe(200);
  });

  it(`${principal}/:id (PATCH) - SECRETARIA_CNC atualiza pessoa com vínculos ativos em paróquias próprias e de terceiros`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaPropriaETerceira.id}`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Propria Terceira Atualizada' });

    expect(response.status).toBe(200);
  });

  it(`${principal}/:id (PATCH) - ADMIN atualiza pessoa sem restrição de escopo`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nome: 'Pessoa Propria Atualizada pelo Admin' });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(pessoaPropria.id);
  });

  it(`${principal}/999999 (PATCH) - 404 | pessoa inexistente`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/999999`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ nome: 'Pessoa Inexistente' });

    expect(response.status).toBe(404);
    expect(response.body.statusCode).toBe(404);
  });

  it(`${principal}/conjugue (GET) - SECRETARIA_CNC da paróquia 1 lista apenas cônjuges da própria paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}/conjugue?sexo=M`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((p: any) => p.id);
    expect(ids).toContain(pessoaPropria.id);
    expect(ids).not.toContain(pessoaOutra.id);
  });

  it(`${principal}/conjugue (GET) - SECRETARIA_CNC da paróquia 2 lista apenas cônjuges da própria paróquia`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}/conjugue?sexo=M`)
      .set('Authorization', `Bearer ${tokenSecretaria2}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((p: any) => p.id);
    expect(ids).toContain(pessoaOutra.id);
    expect(ids).not.toContain(pessoaPropria.id);
  });

  it(`${principal}/conjugue (GET) - ADMIN lista todos os cônjuges`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${principal}/conjugue?sexo=M`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((p: any) => p.id);
    expect(ids).toContain(pessoaPropria.id);
    expect(ids).toContain(pessoaOutra.id);
  });

  it(`${principal}/casal (POST) - SECRETARIA_CNC cria casal com as duas pessoas no escopo`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/casal`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ pessoaId: pessoaCasal1.id, conjugueId: pessoaCasal2.id });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('pessoaMaridoId');
    expect(response.body.data).toHaveProperty('pessoaMulherId');
  });

  it(`${principal}/casal (POST) - SECRETARIA_CNC não cria casal com uma pessoa fora do escopo`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/casal`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ pessoaId: pessoaPropria.id, conjugueId: pessoaOutra.id });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it(`${principal}/:id/contato (POST) - SECRETARIA_CNC cria contato em pessoa do escopo`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaPropria.id}/contato`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(201);
    expect(mockSaoPedroContatoService.createExternalContato).toHaveBeenCalled();
  });

  it(`${principal}/:id/contato (POST) - SECRETARIA_CNC não cria contato em pessoa fora do escopo`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaOutra.id}/contato`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
    expect(
      mockSaoPedroContatoService.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it(`${principal}/:id/contato/:contatoId (PATCH) - SECRETARIA_CNC atualiza contato em pessoa do escopo`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaPropria.id}/contato/9001`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(200);
    expect(mockSaoPedroContatoService.updateExternalContato).toHaveBeenCalled();
  });

  it(`${principal}/:id/contato/:contatoId (PATCH) - SECRETARIA_CNC não atualiza contato em pessoa fora do escopo`, async () => {
    const response = await request(app.getHttpServer())
      .patch(`/${principal}/${pessoaOutra.id}/contato/9001`)
      .set('Authorization', `Bearer ${tokenSecretaria1}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
    expect(
      mockSaoPedroContatoService.updateExternalContato,
    ).not.toHaveBeenCalled();
  });
});
