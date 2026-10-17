import { INestApplication } from '@nestjs/common';
import { setupTestModule } from './test-setup.js';
import request from 'supertest';
import { faker } from '@faker-js/faker/locale/pt_BR';

describe('DioceseController (e2e)', () => {
  let app: INestApplication;
  const principal = 'diocese';
  let token = '';

  beforeAll(async () => {
    app = await setupTestModule();

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', password: 'admin' });

    token = response.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${principal} (GET) - 401 | nao pode ver diocese se nao tiver autenticado`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal} (GET) - 403 | nao pode ver diocese se nao tiver permissao`, async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ronaldinho@admin.com', password: 'admin' });

    const tokenNaoPermitido = response.body.data.access_token;

    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${tokenNaoPermitido}`)
      .expect(403)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Você não tem permissão para listar dioceses',
        );
        expect(res.body.error).toBe('Forbidden');
        expect(res.body.statusCode).toBe(403);
      });
  });

  it(`/${principal} (GET) - 404 | deve retornar diocese nao encontrada by id`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}/4324`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Diocese' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (GET) - 200 | deve retornar dioceses com campos obrigatórios preenchidos`, () => {
    return request(app.getHttpServer())
      .get(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        const diocese = res.body.data[0]; // Pega a primeira diocese da lista

        // Verifica se a estrutura básica está correta
        expect(res.body).toHaveProperty('server');
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('limit');
        expect(res.body.data).toBeInstanceOf(Array);

        // Valida campos obrigatórios da diocese
        expect(diocese).toHaveProperty('id');
        expect(diocese).toHaveProperty('descricao');

        // campos que NAO devem ter no response
        expect(diocese).not.toHaveProperty('tipoDioceseId');
        expect(diocese).not.toHaveProperty('enderecoId');
        expect(diocese.endereco).not.toHaveProperty('UF');
        expect(diocese.endereco).not.toHaveProperty('pais');

        // Valida se 'tipoDiocese' está preenchido corretamente
        expect(diocese.tipoDiocese).toBeDefined();
        expect(diocese.tipoDiocese).toHaveProperty('id');
        expect(diocese.tipoDiocese).toHaveProperty('descricao');

        // Valida se 'endereco' está preenchido corretamente
        expect(diocese.endereco).toBeDefined();
        expect(diocese.endereco).toHaveProperty('id');
        expect(diocese.endereco).toHaveProperty('cep');
        expect(diocese.endereco).toHaveProperty('logradouro');
        expect(diocese.endereco).toHaveProperty('cidade');
        expect(diocese.endereco.cidade).toHaveProperty('estado');
        expect(diocese.endereco.cidade.estado).toHaveProperty('pais');
        expect(diocese.endereco).toHaveProperty('bairro');
        expect(diocese.endereco).toHaveProperty('numero');
        expect(diocese.endereco).toHaveProperty('observacao');
      });
  });

  it(`/${principal} (POST) - 201 | deve criar uma diocese com campos válidos`, async () => {
    const dioceseData = {
      descricao: 'Judiaí',
      tipoDiocese: { id: 2, descricao: 'Diocese' },
      endereco: {
        cep: '13208200',
        logradouro: 'Rua Engenheiro Roberto Mange',
        numero: '400',
        bairro: 'Anhangabaú',
        UF: 'SP',
        cidade: 'Judiaí',
      },
    };

    const response = await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(dioceseData)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.descricao).toBe(dioceseData.descricao);
    expect(response.body.data.tipoDiocese.id).toBe(dioceseData.tipoDiocese.id);
    expect(response.body.data.endereco.cep).toBe(dioceseData.endereco.cep);
    expect(response.body.data.endereco.bairro).toBe(
      dioceseData.endereco.bairro,
    );
    expect(response.body.data.endereco.logradouro).toBe(
      dioceseData.endereco.logradouro,
    );
    expect(response.body.data.endereco.numero).toBe(
      dioceseData.endereco.numero,
    );
    expect(response.body.data.endereco.cidade.nome).toBe(
      dioceseData.endereco.cidade,
    );
    expect(response.body.data.endereco.cidade.estado.sigla).toBe(
      dioceseData.endereco.UF,
    );
    expect(response.body.data.endereco.cidade.estado.pais.nome).toBe('Brasil');
    expect(response.body.data.endereco.observacao).toBeDefined();
  });

  it(`/${principal} (POST) - 404 | nao deve criar uma diocese tipo diocese inexistente`, async () => {
    const dioceseData = {
      descricao: faker.company.name(),
      tipoDiocese: { id: 489, descricao: 'Diocese Mentira' },
      endereco: {
        cep: faker.location.zipCode('########'),
        logradouro: faker.location.streetAddress(),
        numero: '32',
        bairro: faker.location.secondaryAddress(),
        UF: 'SP',
        cidade: 'Nuporanga',
      },
    };

    await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(dioceseData)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          `O registro de 'Tipo de Diocese' não foi encontrado.`,
        );
        expect(res.body.statusCode).toBe(404);
      });
  });

  it(`/${principal} (POST) - 400 | nao deve criar uma diocese tipo diocese null`, async () => {
    const dioceseData = {
      descricao: faker.company.name(),
      endereco: {
        cep: faker.location.zipCode('########'),
        logradouro: faker.location.streetAddress(),
        numero: '32',
        bairro: faker.location.secondaryAddress(),
        UF: 'SP',
        cidade: 'Nuporanga',
      },
    };

    await request(app.getHttpServer())
      .post(`/${principal}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(dioceseData)
      .expect(400)
      .expect((res) => {
        expect(res.body.message[0]).toBe(`tipoDiocese must be an object`);
        expect(res.body.error).toBe('Bad Request');
        expect(res.body.statusCode).toBe(400);
      });
  });

  it(`/${principal} (POST) - 401 | deve falhar sem autenticação`, async () => {
    await request(app.getHttpServer())
      .post(`/${principal}`)
      .send({ descricao: 'Diocese sem token' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal}/1 (PATCH) - 401 | deve falhar sem autenticação by id`, async () => {
    await request(app.getHttpServer())
      .patch(`/${principal}/1`)
      .send({ descricao: 'Diocese sem token' })
      .expect(401)
      .expect((res) => {
        expect(res.body.message).toBe('Invalid or missing token');
        expect(res.body.error).toBe('Unauthorized');
        expect(res.body.statusCode).toBe(401);
      });
  });

  it(`/${principal}/:id (PATCH) - 200 | deve atualizar uma diocese com campos válidos`, async () => {
    const dioceseData = {
      descricao: 'Palmas Francisco Beltrão',
      tipoDiocese: { id: 2, descricao: 'Diocese' },
      endereco: {
        id: 1,
        cep: '85690025',
        logradouro: 'Rua Bispo Dom Carlos',
        numero: '819',
        bairro: 'Centro',
        cidade: 'Brasilia',
        UF: 'DF',
      },
    };

    const response = await request(app.getHttpServer())
      .patch(`/${principal}/1`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(dioceseData)
      .expect(200);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.descricao).toBe(dioceseData.descricao);
    expect(response.body.data.tipoDiocese.id).toBe(dioceseData.tipoDiocese.id);
    expect(response.body.data.endereco.cep).toBe(dioceseData.endereco.cep);
    expect(response.body.data.endereco.bairro).toBe(
      dioceseData.endereco.bairro,
    );
    expect(response.body.data.endereco.numero).toBe(
      dioceseData.endereco.numero,
    );
    expect(response.body.data.endereco.logradouro).toBe(
      dioceseData.endereco.logradouro,
    );
    expect(response.body.data.endereco.cidade.nome).toBe(
      dioceseData.endereco.cidade,
    );
    expect(response.body.data.endereco.cidade.estado.sigla).toBe(
      dioceseData.endereco.UF,
    );
  });

  it(`/${principal}/:id (PATCH) - 404 | não deve atualizar uma diocese com id endereco de outra diocese`, async () => {
    const dioceseData = {
      descricao: faker.company.name(),
      tipoDiocese: { id: 2, descricao: 'Diocese' },
      endereco: {
        id: 9874,
        cep: faker.location.zipCode('########'),
        logradouro: faker.location.streetAddress(),
        numero: '1226',
        bairro: faker.location.secondaryAddress(),
        cidade: faker.location.city(),
        UF: 'SP',
      },
    };

    await request(app.getHttpServer())
      .patch(`/${principal}/2`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send(dioceseData)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe(
          'Endereço id 9874 não encontrada para essa diocese',
        );
        expect(res.body.error).toBe('Not Found');
        expect(res.body.statusCode).toBe(404);
      });
  });
});
