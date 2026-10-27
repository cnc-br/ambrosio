import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { PessoaContato } from 'neocatecumenal';
import { SaoPedroContatoService } from './sao-pedro-contato.service.js';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { ExternalContatoResponse } from './mapper/contato-response.mapper.js';

describe('SaoPedroContatoService', () => {
  let service: SaoPedroContatoService;

  const authServiceMock = {
    executeAuthenticatedRequest: vi.fn(
      async (requestFn: (token: string) => Promise<unknown>) =>
        requestFn('token-mock'),
    ),
  };
  const httpServiceMock = {
    post: vi.fn(),
    get: vi.fn(),
  };
  const abilityMock = {
    ability: { can: vi.fn() },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaoPedroContatoService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: SaoPedroAuthService, useValue: authServiceMock },
        { provide: CaslAbilityService, useValue: abilityMock },
      ],
    }).compile();

    service = module.get<SaoPedroContatoService>(SaoPedroContatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deve enviar o contato para a rota de contatos da pessoa em snake_case e retornar response.data normalizado', async () => {
    const created: ExternalContatoResponse = {
      id: 1,
      pessoa_id: 2,
      tipo_telefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      contato_principal: true,
    };
    httpServiceMock.post.mockReturnValue(of({ data: created }));

    const result = await service.createExternalContato('uuid-pessoa', {
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      contatoPrincipal: true,
    });

    expect(httpServiceMock.post).toHaveBeenCalledWith(
      `${process.env.SAO_PEDRO_API_URL}/api/pessoas/uuid-pessoa/contatos/`,
      {
        tipo_telefone: 'CELULAR',
        telefone: '11987654321',
        email: 'contato@exemplo.com',
        contato_principal: true,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-mock',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual({
      id: 1,
      pessoaId: 2,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      contatoPrincipal: true,
    });
  });

  it('deve omitir contatoPrincipal ausente do payload enviado', async () => {
    httpServiceMock.post.mockReturnValue(
      of({
        data: { id: 1, pessoa_id: 2, contato_principal: true },
      } as { data: ExternalContatoResponse }),
    );

    await service.createExternalContato('uuid-pessoa', {
      tipoTelefone: 'RESIDENCIAL',
      telefone: '1122334455',
    });

    expect(httpServiceMock.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/pessoas/uuid-pessoa/contatos/'),
      { tipo_telefone: 'RESIDENCIAL', telefone: '1122334455' },
      expect.anything(),
    );
  });

  it('deve buscar os contatos da pessoa (resposta com envelope data) e devolver em camelCase', async () => {
    const contatos: ExternalContatoResponse[] = [
      {
        id: 1,
        pessoa_id: 2,
        tipo_telefone: 'CELULAR',
        telefone: '11987654321',
        contato_principal: true,
      },
    ];
    httpServiceMock.get = vi
      .fn()
      .mockReturnValue(of({ data: { data: contatos } }));

    const result = await service.findExternalContatos('uuid-pessoa');

    expect(httpServiceMock.get).toHaveBeenCalledWith(
      `${process.env.SAO_PEDRO_API_URL}/api/pessoas/uuid-pessoa/contatos/`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-mock',
        }),
      }),
    );
    expect(result).toEqual([
      {
        id: 1,
        pessoaId: 2,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        contatoPrincipal: true,
      } satisfies PessoaContato,
    ]);
  });

  it('deve buscar os contatos da pessoa (resposta como array direto) e devolver em camelCase', async () => {
    const contatos: ExternalContatoResponse[] = [
      {
        id: 1,
        pessoa_id: 2,
        tipo_telefone: 'CELULAR',
        contato_principal: false,
      },
    ];
    httpServiceMock.get = vi.fn().mockReturnValue(of({ data: contatos }));

    const result = await service.findExternalContatos('uuid-pessoa');

    expect(result).toEqual([
      {
        id: 1,
        pessoaId: 2,
        tipoTelefone: 'CELULAR',
        contatoPrincipal: false,
      } satisfies PessoaContato,
    ]);
  });

  it('deve retornar array vazio quando a resposta nao tem contatos', async () => {
    httpServiceMock.get = vi.fn().mockReturnValue(of({ data: undefined }));

    const result = await service.findExternalContatos('uuid-pessoa');

    expect(result).toEqual([]);
  });
});