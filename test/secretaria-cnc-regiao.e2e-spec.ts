/* eslint-disable @typescript-eslint/no-explicit-any */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { PrismaService } from 'src/prisma.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from './mocks/sao-pedro-api-mock.js';

describe('SecretariaCncEscopoSecao (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sufixo = Date.now();

  let tokenCnc = '';
  let cncUserId = '';

  let paroquiaSetor1: { id: number };
  let paroquiaSetor2: { id: number };
  let comunidadeSetor1: { id: number };
  let comunidadeSetor1b: { id: number };
  let comunidadeSetor2: { id: number };

  let pessoaPropria: { id: number; externalId: string };
  let pessoaOutra: { id: number; externalId: string };
  let pessoaSemVinculo: { id: number; externalId: string };
  let pessoaCasal1: { id: number; externalId: string };
  let pessoaCasal2: { id: number; externalId: string };
  let carismaId: number;

  const externalPessoas = new Map<string, any>();

  const externalPessoaMock = (
    externalId: string,
    nome: string,
    sexo: 'M' | 'F',
  ) => ({
    id: 1,
    externalId,
    nome,
    cpf: '12345678901',
    estadoCivil: 'C',
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

    return prisma.pessoa.create({
      data: {
        externalId,
        situacaoReligiosaId: 1,
      },
    });
  };

  const criarVinculo = async (pessoaId: number, comunidadeId: number) => {
    await prisma.comunidadePessoa.create({
      data: {
        pessoaId,
        comunidadeId,
        dataEntrada: new Date(),
      },
    });
  };

  const criarParoquiaNoSetor2 = async () => {
    const cidade = await prisma.cidade.findFirstOrThrow({
      where: { nome: 'Franca' },
    });
    const endereco = await prisma.endereco.create({
      data: {
        cep: '14400000',
        logradouro: 'Rua do Setor 2',
        numero: '5',
        bairro: 'Centro',
        cidadeId: cidade.id,
      },
    });

    return prisma.paroquia.create({
      data: {
        descricao: `Paroquia Setor 2 ${sufixo}`.slice(0, 50),
        dioceseId: 1,
        enderecoId: endereco.id,
        setorId: 2,
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

    const cnc = await prisma.user.findUniqueOrThrow({
      where: { email: 'secretaria-cnc@admin.com' },
      include: { usuarioSetores: true },
    });
    cncUserId = cnc.id;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'secretaria-cnc@admin.com', password: 'admin' });
    tokenCnc = login.body.data.access_token;

    const setorId = cnc.usuarioSetores[0].setorId;
    paroquiaSetor1 = await prisma.paroquia.findFirstOrThrow({
      where: { setorId },
    });
    comunidadeSetor1 = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: paroquiaSetor1.id },
    });
    comunidadeSetor1b = await prisma.comunidade.findFirstOrThrow({
      where: {
        paroquiaId: paroquiaSetor1.id,
        id: { not: comunidadeSetor1.id },
      },
    });

    paroquiaSetor2 = await criarParoquiaNoSetor2();
    comunidadeSetor2 = await prisma.comunidade.create({
      data: {
        numeroDaComunidade: 1,
        quantidadeMembros: 10,
        paroquiaId: paroquiaSetor2.id,
      },
    });

    pessoaPropria = await criarPessoa(
      `cnc-setor-propria-${sufixo}`,
      'CNC Própria',
      'M',
    );
    await criarVinculo(pessoaPropria.id, comunidadeSetor1.id);

    pessoaOutra = await criarPessoa(
      `cnc-setor-outra-${sufixo}`,
      'CNC Outra',
      'F',
    );
    await criarVinculo(pessoaOutra.id, comunidadeSetor2.id);

    pessoaSemVinculo = await criarPessoa(
      `cnc-setor-sem-vinculo-${sufixo}`,
      'CNC Sem Vínculo',
      'M',
    );

    pessoaCasal1 = await criarPessoa(
      `cnc-setor-casal-1-${sufixo}`,
      'CNC Casal 1',
      'M',
    );
    await criarVinculo(pessoaCasal1.id, comunidadeSetor1.id);

    pessoaCasal2 = await criarPessoa(
      `cnc-setor-casal-2-${sufixo}`,
      'CNC Casal 2',
      'F',
    );
    await criarVinculo(pessoaCasal2.id, comunidadeSetor1b.id);

    const carisma = await prisma.carisma.findFirstOrThrow();
    carismaId = carisma.id;

    vi.spyOn(mockSaoPedroPessoaService, 'findAllPessoas').mockResolvedValue(
      [...externalPessoas.values()] as never,
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
    ).mockResolvedValue([...externalPessoas.values()] as never);
    vi.spyOn(
      mockSaoPedroPessoaService,
      'updateExternalPessoa',
    ).mockResolvedValue({} as never);
    vi.spyOn(
      mockSaoPedroContatoService,
      'createExternalContato',
    ).mockResolvedValue({
      id: 9101,
      pessoaId: 1,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      contatoPrincipal: true,
    } as never);
    vi.spyOn(
      mockSaoPedroContatoService,
      'updateExternalContato',
    ).mockResolvedValue({
      id: 9101,
      pessoaId: 1,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      contatoPrincipal: true,
    } as never);
    vi.spyOn(
      mockSaoPedroContatoService,
      'findExternalContatos',
    ).mockResolvedValue([] as never);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usuário SECRETARIA_CNC está vinculado a um setor', () => {
    expect(cncUserId).toBeDefined();
    expect(paroquiaSetor1.id).not.toBe(paroquiaSetor2.id);
  });

  it('/comunidade (GET) - 200 | lista apenas comunidades dos seus setores', async () => {
    const response = await request(app.getHttpServer())
      .get('/comunidade')
      .set('Authorization', `Bearer ${tokenCnc}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((comunidade: any) => comunidade.id);
    expect(ids).toContain(comunidadeSetor1.id);
    expect(ids).not.toContain(comunidadeSetor2.id);
  });

  it('/comunidade (POST) - 201 | cadastra comunidade em paróquia do seu setor', async () => {
    const usados = await prisma.comunidade.findMany({
      where: { paroquiaId: paroquiaSetor1.id },
      select: { numeroDaComunidade: true },
    });
    const numeroLivre = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (numero) => !usados.some((c) => c.numeroDaComunidade === numero),
    );

    const response = await request(app.getHttpServer())
      .post('/comunidade')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({
        numeroDaComunidade: numeroLivre,
        quantidadeMembros: 8,
        paroquiaId: paroquiaSetor1.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.paroquia.id).toBe(paroquiaSetor1.id);
  });

  it('/comunidade (POST) - 403 | não cadastra comunidade em paróquia de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .post('/comunidade')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({
        numeroDaComunidade: 29,
        quantidadeMembros: 8,
        paroquiaId: paroquiaSetor2.id,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/comunidade/:id (PATCH) - 403 | não atualiza comunidade de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comunidade/${comunidadeSetor2.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ quantidadeMembros: 20 });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
  });

  it('/pessoa (GET) - 200 | mantém a leitura de pessoas irrestrita', async () => {
    const response = await request(app.getHttpServer())
      .get('/pessoa')
      .set('Authorization', `Bearer ${tokenCnc}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((pessoa: any) => pessoa.id);
    expect(ids).toEqual(
      expect.arrayContaining([pessoaPropria.id, pessoaOutra.id]),
    );
  });

  it('/pessoa/:id (PATCH) - 200 | atualiza pessoa do seu setor', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ nome: 'Pessoa CNC Própria Atualizada' });

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(pessoaPropria.id);

    const atualizada = await prisma.pessoa.findUniqueOrThrow({
      where: { id: pessoaPropria.id },
    });
    expect(atualizada.atualizadoPorId).toBe(cncUserId);
  });

  it('/pessoa/:id (PATCH) - 200 | atualiza pessoa sem vínculo ativo', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/pessoa/${pessoaSemVinculo.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ nome: 'Pessoa CNC Sem Vínculo Atualizada' });

    expect(response.status).toBe(200);
  });

  it('/pessoa/:id (PATCH) - 403 | não atualiza pessoa de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ nome: 'Pessoa CNC Outra Atualizada' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/pessoa/casal (POST) - 201 | cria casal com as duas pessoas no seu setor', async () => {
    const response = await request(app.getHttpServer())
      .post('/pessoa/casal')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ pessoaId: pessoaCasal1.id, conjugueId: pessoaCasal2.id });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('pessoaMaridoId');
    expect(response.body.data).toHaveProperty('pessoaMulherId');
  });

  it('/pessoa/casal (POST) - 403 | não cria casal com pessoa de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .post('/pessoa/casal')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ pessoaId: pessoaPropria.id, conjugueId: pessoaOutra.id });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/pessoa/:id/contato (POST) - 201 | cria contato em pessoa do seu setor', async () => {
    const response = await request(app.getHttpServer())
      .post(`/pessoa/${pessoaPropria.id}/contato`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(201);
    expect(mockSaoPedroContatoService.createExternalContato).toHaveBeenCalled();
  });

  it('/pessoa/:id/contato (POST) - 403 | não cria contato em pessoa de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .post(`/pessoa/${pessoaOutra.id}/contato`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
    expect(
      mockSaoPedroContatoService.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('/carismas/pessoa/:pessoaId (POST) - 201 | atualiza carismas de pessoa do seu setor', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(201);
    expect(response.body.data.pessoaId).toBe(pessoaPropria.id);
  });

  it('/carismas/pessoa/:pessoaId (POST) - 403 | não atualiza carismas de pessoa de outro setor', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
  });
});
