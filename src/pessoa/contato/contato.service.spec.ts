import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ContatoService } from './contato.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';
import { PessoaService } from '../pessoa.service.js';

describe('ContatoService', () => {
  let service: ContatoService;

  const pessoaServiceMock = {
    validarPessoaDentroDoEscopoDeAtualizacao: vi.fn(),
  };
  const saoPedroContatoServiceMock = {
    createExternalContato: vi.fn(),
    updateExternalContato: vi.fn(),
    findExternalContatos: vi.fn(),
  };
  const abilityMock = {
    ability: { can: vi.fn() },
  };

  const contatoCriado = {
    id: 1,
    pessoaId: 10,
    tipoTelefone: 'CELULAR',
    telefone: '11987654321',
    email: 'contato@exemplo.com',
    contatoPrincipal: true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    abilityMock.ability.can.mockReturnValue(true);
    pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockResolvedValue({
      externalId: 'uuid-pessoa',
    });
    saoPedroContatoServiceMock.createExternalContato.mockResolvedValue(
      contatoCriado,
    );
    saoPedroContatoServiceMock.updateExternalContato.mockResolvedValue(
      contatoCriado,
    );
    saoPedroContatoServiceMock.findExternalContatos.mockResolvedValue([
      contatoCriado,
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContatoService,
        { provide: PessoaService, useValue: pessoaServiceMock },
        {
          provide: SaoPedroContatoService,
          useValue: saoPedroContatoServiceMock,
        },
        { provide: CaslAbilityService, useValue: abilityMock },
      ],
    }).compile();

    service = module.get<ContatoService>(ContatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('deve lançar ForbiddenException sem permissão de create pessoa', async () => {
    abilityMock.ability.can.mockReturnValue(false);

    await expect(
      service.create(1, { telefone: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
    ).not.toHaveBeenCalled();
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('deve resolver a pessoa pelo id e delegar a criação à São Pedro com o externalId', async () => {
    const dto: CreatePessoaContatoDto = {
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
    };

    const result = await service.create(1, dto);

    expect(
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
    ).toHaveBeenCalledWith(1);
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).toHaveBeenCalledWith('uuid-pessoa', dto);
    expect(result).toEqual(contatoCriado);
  });

  it('deve propagar erro de pessoa inexistente (P2025) sem chamar o serviço externo', async () => {
    const notFoundError = Object.assign(
      new Error('O registro de Pessoa não foi encontrado.'),
      { code: 'P2025' },
    );
    pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
      notFoundError,
    );

    await expect(
      service.create(999, { telefone: '11999999999' }),
    ).rejects.toBe(notFoundError);

    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('deve lançar ForbiddenException sem permissão de update pessoa', async () => {
    abilityMock.ability.can.mockImplementation((action: string) =>
      action !== 'update',
    );

    await expect(
      service.update(1, '1', { telefone: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
    ).not.toHaveBeenCalled();
    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('deve resolver a pessoa pelo id e delegar a atualização à São Pedro pelo id do contato externo', async () => {
    const dto = {
      telefone: '11987654321',
      email: 'contato@exemplo.com',
    };

    const result = await service.update(1, '1', dto);

    expect(
      pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao,
    ).toHaveBeenCalledWith(1);
    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).toHaveBeenCalledWith('1', dto);
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
    expect(result).toEqual(contatoCriado);
  });

  it('deve propagar erro de pessoa inexistente (P2025) na atualização sem chamar o serviço externo', async () => {
    const notFoundError = Object.assign(
      new Error('O registro de Pessoa não foi encontrado.'),
      { code: 'P2025' },
    );
    pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
      notFoundError,
    );

    await expect(
      service.update(999, '1', { telefone: '11999999999' }),
    ).rejects.toBe(notFoundError);

    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('SECRETARIA_CNC cria contato em pessoa fora do escopo', async () => {
    pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
      new ForbiddenException('Fora do escopo'),
    );

    await expect(
      service.create(1, { telefone: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('SECRETARIA_CNC cria contato em pessoa sem vínculo ativo', async () => {
    const result = await service.create(1, { telefone: '11999999999' });

    expect(result).toEqual(contatoCriado);
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).toHaveBeenCalled();
  });

  it('ADMIN cria contato sem restrição de escopo', async () => {
    const result = await service.create(1, { telefone: '11999999999' });

    expect(result).toEqual(contatoCriado);
    expect(
      saoPedroContatoServiceMock.createExternalContato,
    ).toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza contato em pessoa fora do escopo', async () => {
    pessoaServiceMock.validarPessoaDentroDoEscopoDeAtualizacao.mockRejectedValue(
      new ForbiddenException('Fora do escopo'),
    );

    await expect(
      service.update(1, '1', { telefone: '11999999999' }),
    ).rejects.toThrow(ForbiddenException);

    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).not.toHaveBeenCalled();
  });

  it('SECRETARIA_CNC atualiza contato em pessoa sem vínculo ativo', async () => {
    const result = await service.update(1, '1', {
      telefone: '11999999999',
    });

    expect(result).toEqual(contatoCriado);
    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).toHaveBeenCalled();
  });

  it('ADMIN atualiza contato sem restrição de escopo', async () => {
    const result = await service.update(1, '1', {
      telefone: '11999999999',
    });

    expect(result).toEqual(contatoCriado);
    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).toHaveBeenCalled();
  });

  it('não atualiza contato de outra pessoa', async () => {
    saoPedroContatoServiceMock.findExternalContatos.mockResolvedValue([
      { ...contatoCriado, id: 2 },
    ]);

    await expect(
      service.update(1, '1', { telefone: '11999999999' }),
    ).rejects.toThrow(NotFoundException);

    expect(
      saoPedroContatoServiceMock.updateExternalContato,
    ).not.toHaveBeenCalled();
  });
});
