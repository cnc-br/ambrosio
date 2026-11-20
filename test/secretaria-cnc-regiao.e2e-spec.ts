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

describe('SecretariaCncEscopoRegiao (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const sufixo = Date.now();

  let tokenCnc = '';
  let cncUserId = '';

  let paroquiaPropria: { id: number };
  let paroquiaExterna: { id: number };
  let comunidadePropria: { id: number };
  let comunidadePropria2: { id: number };
  let comunidadeExterna: { id: number };
  let enderecoExternoId = 0;
  let setorExternoId = 0;
  let regiaoExternaId = 0;

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

  const criarParoquiaEmOutraRegiao = async () => {
    const cidade = await prisma.cidade.findFirstOrThrow({
      where: { nome: 'Franca' },
    });

    const regiao = await prisma.regiao.create({
      data: {
        descricao: `Regiao externa ${sufixo}`.slice(0, 100),
        macroRegiaoId: 1,
      },
    });
    regiaoExternaId = regiao.id;

    const setor = await prisma.setor.create({
      data: {
        descricao: `Setor externo ${sufixo}`.slice(0, 50),
        regiaoId: regiao.id,
      },
    });
    setorExternoId = setor.id;

    const endereco = await prisma.endereco.create({
      data: {
        cep: '14400000',
        logradouro: 'Rua de Outra Região',
        numero: '5',
        bairro: 'Centro',
        cidadeId: cidade.id,
      },
    });
    enderecoExternoId = endereco.id;

    return prisma.paroquia.create({
      data: {
        descricao: `Paroquia Externa ${sufixo}`.slice(0, 50),
        dioceseId: 1,
        enderecoId: endereco.id,
        setorId: setor.id,
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
      include: { usuarioRegioes: true },
    });
    cncUserId = cnc.id;

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'secretaria-cnc@admin.com', password: 'admin' });
    tokenCnc = login.body.data.access_token;

    const regiaoId = cnc.usuarioRegioes[0].regiaoId;
    const setorProprio = await prisma.setor.findFirstOrThrow({
      where: { regiaoId },
    });
    paroquiaPropria = await prisma.paroquia.findFirstOrThrow({
      where: { setorId: setorProprio.id },
    });
    comunidadePropria = await prisma.comunidade.findFirstOrThrow({
      where: { paroquiaId: paroquiaPropria.id },
    });
    comunidadePropria2 = await prisma.comunidade.findFirstOrThrow({
      where: {
        paroquiaId: paroquiaPropria.id,
        id: { not: comunidadePropria.id },
      },
    });

    paroquiaExterna = await criarParoquiaEmOutraRegiao();
    comunidadeExterna = await prisma.comunidade.create({
      data: {
        numeroDaComunidade: 1,
        quantidadeMembros: 10,
        paroquiaId: paroquiaExterna.id,
      },
    });

    pessoaPropria = await criarPessoa(
      `cnc-regiao-propria-${sufixo}`,
      'CNC Própria',
      'M',
    );
    await criarVinculo(pessoaPropria.id, comunidadePropria.id);

    pessoaOutra = await criarPessoa(
      `cnc-regiao-outra-${sufixo}`,
      'CNC Outra',
      'F',
    );
    await criarVinculo(pessoaOutra.id, comunidadeExterna.id);

    pessoaSemVinculo = await criarPessoa(
      `cnc-regiao-sem-vinculo-${sufixo}`,
      'CNC Sem Vínculo',
      'M',
    );

    pessoaCasal1 = await criarPessoa(
      `cnc-regiao-casal-1-${sufixo}`,
      'CNC Casal 1',
      'M',
    );
    await criarVinculo(pessoaCasal1.id, comunidadePropria.id);

    pessoaCasal2 = await criarPessoa(
      `cnc-regiao-casal-2-${sufixo}`,
      'CNC Casal 2',
      'F',
    );
    await criarVinculo(pessoaCasal2.id, comunidadePropria2.id);

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
    // Remove a região/setor/paróquia criados para o cenário "de fora" para não
    // afetar as contagens exatas dos e2e do mapa.
    if (paroquiaExterna?.id) {
      await prisma.comunidade.deleteMany({
        where: { paroquiaId: paroquiaExterna.id },
      });
      await prisma.paroquia.deleteMany({ where: { id: paroquiaExterna.id } });
    }
    if (enderecoExternoId) {
      await prisma.endereco.deleteMany({ where: { id: enderecoExternoId } });
    }
    if (setorExternoId) {
      await prisma.setor.deleteMany({ where: { id: setorExternoId } });
    }
    if (regiaoExternaId) {
      await prisma.regiao.deleteMany({ where: { id: regiaoExternaId } });
    }

    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usuário SECRETARIA_CNC está vinculado a uma região', () => {
    expect(cncUserId).toBeDefined();
    expect(paroquiaPropria.id).not.toBe(paroquiaExterna.id);
  });

  it('/comunidade (GET) - 200 | lista apenas comunidades das suas regiões', async () => {
    const response = await request(app.getHttpServer())
      .get('/comunidade')
      .set('Authorization', `Bearer ${tokenCnc}`);

    expect(response.status).toBe(200);
    const ids = response.body.data.map((comunidade: any) => comunidade.id);
    expect(ids).toContain(comunidadePropria.id);
    expect(ids).not.toContain(comunidadeExterna.id);
  });

  it('/comunidade (POST) - 201 | cadastra comunidade em paróquia da sua região', async () => {
    const usados = await prisma.comunidade.findMany({
      where: { paroquiaId: paroquiaPropria.id },
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
        paroquiaId: paroquiaPropria.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.paroquia.id).toBe(paroquiaPropria.id);
  });

  it('/comunidade (POST) - 403 | não cadastra comunidade em paróquia de outra região', async () => {
    const response = await request(app.getHttpServer())
      .post('/comunidade')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({
        numeroDaComunidade: 29,
        quantidadeMembros: 8,
        paroquiaId: paroquiaExterna.id,
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/comunidade/:id (PATCH) - 403 | não atualiza comunidade de outra região', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comunidade/${comunidadeExterna.id}`)
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

  it('/pessoa/:id (PATCH) - 200 | atualiza pessoa da sua região', async () => {
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

  it('/pessoa/:id (PATCH) - 403 | não atualiza pessoa de outra região', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ nome: 'Pessoa CNC Outra Atualizada' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/pessoa/casal (POST) - 201 | cria casal com as duas pessoas na sua região', async () => {
    const response = await request(app.getHttpServer())
      .post('/pessoa/casal')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ pessoaId: pessoaCasal1.id, conjugueId: pessoaCasal2.id });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('pessoaMaridoId');
    expect(response.body.data).toHaveProperty('pessoaMulherId');
  });

  it('/pessoa/casal (POST) - 403 | não cria casal com pessoa de outra região', async () => {
    const response = await request(app.getHttpServer())
      .post('/pessoa/casal')
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ pessoaId: pessoaPropria.id, conjugueId: pessoaOutra.id });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
    expect(response.body.statusCode).toBe(403);
  });

  it('/pessoa/:id/contato (POST) - 201 | cria contato em pessoa da sua região', async () => {
    const response = await request(app.getHttpServer())
      .post(`/pessoa/${pessoaPropria.id}/contato`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ telefone: '11987654321' });

    expect(response.status).toBe(201);
    expect(mockSaoPedroContatoService.createExternalContato).toHaveBeenCalled();
  });

  it('/pessoa/:id/contato (POST) - 403 | não cria contato em pessoa de outra região', async () => {
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

  it('/carismas/pessoa/:pessoaId (POST) - 201 | atualiza carismas de pessoa da sua região', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaPropria.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(201);
    expect(response.body.data.pessoaId).toBe(pessoaPropria.id);
  });

  it('/carismas/pessoa/:pessoaId (POST) - 403 | não atualiza carismas de pessoa de outra região', async () => {
    const response = await request(app.getHttpServer())
      .post(`/carismas/pessoa/${pessoaOutra.id}`)
      .set('Authorization', `Bearer ${tokenCnc}`)
      .send({ carismaIds: [carismaId] });

    expect(response.status).toBe(403);
    expect(response.body.statusCode).toBe(403);
  });
});
