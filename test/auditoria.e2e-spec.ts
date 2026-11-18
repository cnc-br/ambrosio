import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupTestModule } from './test-setup.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import {
  mockSaoPedroPessoaService,
  mockSaoPedroContatoService,
} from './mocks/sao-pedro-api-mock.js';

describe('AuditoriaInterceptor (e2e)', () => {
  let app: INestApplication;
  let tokenAdmin = '';

  const ENVELOPE_KEYS = ['server', 'total', 'page', 'limit', 'data'];

  const login = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'admin' });

    return response.body.data.access_token;
  };

  const expectSemAuditoria = (payload: unknown) => {
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('cadastradoPorId');
    expect(serialized).not.toContain('atualizadoPorId');
  };

  beforeAll(async () => {
    app = await setupTestModule([
      { provider: SaoPedroPessoaService, value: mockSaoPedroPessoaService },
      { provider: SaoPedroContatoService, value: mockSaoPedroContatoService },
    ]);
    tokenAdmin = await login('admin@admin.com');
  });

  afterAll(async () => {
    await app.close();
  });

  const rotasAutenticadas = ['/pessoa', '/comunidade', '/carismas', '/avisos'];

  it.each(rotasAutenticadas)(
    'GET %s não expõe auditoria e mantém o envelope de paginação',
    async (rota) => {
      const response = await request(app.getHttpServer())
        .get(rota)
        .set('Authorization', `Bearer ${tokenAdmin}`);

      expect(response.status).toBe(200);
      expect(Object.keys(response.body).sort()).toEqual(
        [...ENVELOPE_KEYS].sort(),
      );
      expect(Array.isArray(response.body.data)).toBe(true);
      expectSemAuditoria(response.body);
    },
  );

  it('GET /endereco/pessoa/:id não expõe auditoria', async () => {
    const pessoaResponse = await request(app.getHttpServer())
      .get('/pessoa')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const pessoa = pessoaResponse.body.data[0];
    expect(pessoa).toBeDefined();

    const response = await request(app.getHttpServer())
      .get(`/endereco/pessoa/${pessoa.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(response.status).toBe(200);
    expectSemAuditoria(response.body);
  });
});
