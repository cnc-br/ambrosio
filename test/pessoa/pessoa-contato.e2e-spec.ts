import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from '../test-setup.js';
import { pessoaMock } from '../mocks/pessoa-mock.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from '../mocks/sao-pedro-api-mock.js';

describe('PessoaContatoController (e2e)', () => {
  let app: INestApplication;
  const principal = 'pessoa';
  let token = '';
  let pessoaId = 0;
  let pessoaUuid = '';

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
    pessoaUuid = pessoaResponse.body.data.externalId;

    // Limpa o histórico de chamadas acumuladas durante o setup
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it(`/${principal}/:id/contato (POST) - 401 | nao pode criar contato se nao tiver autenticado`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .send({ telefone: '11999999999' })
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
      .send({ telefone: '11999999999' })
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para create pessoa',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal}/:id/contato (POST) - 404 | nao pode criar contato para pessoa inexistente`, async () => {
    const response = await request(app.getHttpServer())
      .post(`/${principal}/999999/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ telefone: '11999999999' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(`O registro de 'Pessoa' não foi encontrado.`);
    expect(response.body.statusCode).toBe(404);
    expect(mockSaoPedroContatoService.createExternalContato).not.toHaveBeenCalled();
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

  it(`/${principal}/:id/contato (POST) - 400 | nao pode criar contato com tipoTelefone fora do enum`, () => {
    return request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tipoTelefone: 'FAX' })
      .expect(400)
      .expect((res) => {
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.statusCode).toBe(400);
        expect(JSON.stringify(res.body.message)).toContain('tipoTelefone');
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

  it(`/${principal}/:id/contato (POST) - 201 | deve criar contato com todos os campos via Sao Pedro`, async () => {
    const payload = {
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      observacao: 'Contato principal',
      contatoPrincipal: false,
    };
    const contatoCriado = {
      id: 500,
      pessoaId: 999,
      ...payload,
    };

    mockSaoPedroContatoService.createExternalContato.mockResolvedValue(
      contatoCriado,
    );

    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(contatoCriado);
    expect(
      mockSaoPedroContatoService.createExternalContato,
    ).toHaveBeenCalledWith(pessoaUuid, payload);
  });

  it(`/${principal}/:id/contato (POST) - 201 | contato sem contatoPrincipal usa o default da Sao Pedro`, async () => {
    const payload = { tipoTelefone: 'CELULAR', telefone: '11987654321' };
    const contatoCriado = {
      id: 501,
      pessoaId: 999,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      contatoPrincipal: true,
    };

    mockSaoPedroContatoService.createExternalContato.mockResolvedValue(
      contatoCriado,
    );

    const response = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(contatoCriado);
    // campo ausente não é enviado à São Pedro (default aplicado por ela)
    expect(
      mockSaoPedroContatoService.createExternalContato,
    ).toHaveBeenCalledWith(pessoaUuid, payload);
    expect(payload).not.toHaveProperty('contatoPrincipal');
  });

  it(`/${principal}/:id/contato (POST) - 201 | principal unico delegado a Sao Pedro (rebaixamento simulado pelo mock)`, async () => {
    const primeiroPayload = {
      email: 'primeiro@exemplo.com',
      contatoPrincipal: true,
    };
    const segundoPayload = {
      email: 'segundo@exemplo.com',
      contatoPrincipal: true,
    };

    mockSaoPedroContatoService.createExternalContato.mockResolvedValueOnce({
      id: 601,
      pessoaId: 999,
      email: 'primeiro@exemplo.com',
      contatoPrincipal: true,
    });
    mockSaoPedroContatoService.createExternalContato.mockResolvedValueOnce({
      id: 602,
      pessoaId: 999,
      email: 'segundo@exemplo.com',
      contatoPrincipal: true,
    });

    const primeiro = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send(primeiroPayload);

    expect(primeiro.status).toBe(201);
    expect(primeiro.body.data).toHaveProperty('contatoPrincipal', true);

    const segundo = await request(app.getHttpServer())
      .post(`/${principal}/${pessoaId}/contato`)
      .set('Authorization', `Bearer ${token}`)
      .send(segundoPayload);

    expect(segundo.status).toBe(201);
    expect(segundo.body.data).toHaveProperty('contatoPrincipal', true);

    // os dois envios chegam à São Pedro com contatoPrincipal true
    expect(mockSaoPedroContatoService.createExternalContato).toHaveBeenNthCalledWith(
      1,
      pessoaUuid,
      primeiroPayload,
    );
    expect(mockSaoPedroContatoService.createExternalContato).toHaveBeenNthCalledWith(
      2,
      pessoaUuid,
      segundoPayload,
    );
  });
});