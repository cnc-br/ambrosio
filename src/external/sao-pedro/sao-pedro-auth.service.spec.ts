import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';

describe('SaoPedroAuthService.executeAuthenticatedRequest', () => {
  let service: SaoPedroAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaoPedroAuthService,
        { provide: HttpService, useValue: {} },
      ],
    }).compile();

    service = module.get<SaoPedroAuthService>(SaoPedroAuthService);
    vi.spyOn(service, 'getValidToken').mockResolvedValue('token-mock');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('preserva o corpo de erro (objeto) e o status da São Pedro em erro não-401', async () => {
    const upstreamError = {
      message: 'Request failed with status code 404',
      response: {
        status: 404,
        data: { detail: 'Contato não encontrado.' },
      },
    };

    const thrown = await service
      .executeAuthenticatedRequest(() => Promise.reject(upstreamError), 'update')
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(404);
    expect(thrown.getResponse()).toEqual({
      statusCode: 404,
      detail: 'Contato não encontrado.',
    });
  });

  it('preserva a mensagem de erro (string) da São Pedro quando o corpo é texto', async () => {
    const upstreamError = {
      message: 'Request failed with status code 400',
      response: {
        status: 400,
        data: 'Dados inválidos na São Pedro',
      },
    };

    const thrown = await service
      .executeAuthenticatedRequest(() => Promise.reject(upstreamError), 'update')
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(400);
    expect(thrown.getResponse()).toEqual({
      statusCode: 400,
      message: 'Dados inválidos na São Pedro',
    });
  });

  it('usa a mensagem do erro como fallback quando não há resposta upstream', async () => {
    const networkError = new Error('connect ECONNREFUSED 127.0.0.1:8000');

    const thrown = await service
      .executeAuthenticatedRequest(
        () => Promise.reject(networkError),
        'update',
      )
      .catch((error) => error);

    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(500);
    expect(thrown.getResponse()).toEqual({
      statusCode: 500,
      message: 'connect ECONNREFUSED 127.0.0.1:8000',
    });
  });

  it('preserva os detalhes upstream quando a nova tentativa após 401 também falha', async () => {
    vi.spyOn(service, 'handleAuthError').mockResolvedValue('novo-token');
    const unauthorized = { response: { status: 401, data: { detail: 'expired' } } };
    const retryError = {
      message: 'Request failed with status code 422',
      response: {
        status: 422,
        data: { detail: 'Contato inválido.' },
      },
    };

    const requestFn = vi
      .fn()
      .mockRejectedValueOnce(unauthorized)
      .mockRejectedValueOnce(retryError);

    const thrown = await service
      .executeAuthenticatedRequest(requestFn, 'update')
      .catch((error) => error);

    expect(requestFn).toHaveBeenCalledTimes(2);
    expect(thrown).toBeInstanceOf(HttpException);
    expect(thrown.getStatus()).toBe(422);
    expect(thrown.getResponse()).toEqual({
      statusCode: 422,
      detail: 'Contato inválido.',
    });
  });
});