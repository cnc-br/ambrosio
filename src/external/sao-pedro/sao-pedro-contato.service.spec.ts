import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { PessoaContato } from 'neocatecumenal';
import { SaoPedroContatoService } from './sao-pedro-contato.service.js';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';

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

  it('deve enviar o contato para a rota de contatos da pessoa e retornar response.data', async () => {
    const created: PessoaContato = {
      id: 1,
      pessoaId: 2,
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      contatoPrincipal: true,
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
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        email: 'contato@exemplo.com',
        contatoPrincipal: true,
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-mock',
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(result).toEqual(created);
  });

  it('deve omitir contatoPrincipal ausente do payload enviado', async () => {
    httpServiceMock.post.mockReturnValue(
      of({
        data: { id: 1, pessoaId: 2, contatoPrincipal: true },
      } as { data: PessoaContato }),
    );

    await service.createExternalContato('uuid-pessoa', {
      tipoTelefone: 'RESIDENCIAL',
      telefone: '1122334455',
    });

    expect(httpServiceMock.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/pessoas/uuid-pessoa/contatos/'),
      { tipoTelefone: 'RESIDENCIAL', telefone: '1122334455' },
      expect.anything(),
    );
  });

  it('deve buscar os contatos da pessoa (resposta com envelope data)', async () => {
    const contatos: PessoaContato[] = [
      {
        id: 1,
        pessoaId: 2,
        tipoTelefone: 'CELULAR',
        telefone: '11987654321',
        contatoPrincipal: true,
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
    expect(result).toEqual(contatos);
  });

  it('deve buscar os contatos da pessoa (resposta como array direto)', async () => {
    const contatos: PessoaContato[] = [
      { id: 1, pessoaId: 2, tipoTelefone: 'CELULAR', contatoPrincipal: false },
    ];
    httpServiceMock.get = vi.fn().mockReturnValue(of({ data: contatos }));

    const result = await service.findExternalContatos('uuid-pessoa');

    expect(result).toEqual(contatos);
  });

  it('deve retornar array vazio quando a resposta nao tem contatos', async () => {
    httpServiceMock.get = vi.fn().mockReturnValue(of({ data: undefined }));

    const result = await service.findExternalContatos('uuid-pessoa');

    expect(result).toEqual([]);
  });
});