import { describe, expect, it } from 'vitest';
import { CreateContatoMapper } from './create-contato.mapper.js';
import { CreatePessoaContatoDto } from 'src/pessoa/dto/create-pessoa-contato.dto.js';

describe('CreateContatoMapper', () => {
  it('deve mapear o DTO para payload camelCase da São Pedro com todos os campos', () => {
    const dto: CreatePessoaContatoDto = {
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      observacao: 'Contato do WhatsApp',
      contatoPrincipal: true,
    };

    expect(CreateContatoMapper.toExternal(dto)).toEqual({
      tipoTelefone: 'CELULAR',
      telefone: '11987654321',
      email: 'contato@exemplo.com',
      observacao: 'Contato do WhatsApp',
      contatoPrincipal: true,
    });
  });

  it('deve omitir os campos ausentes (não ocorre o default local)', () => {
    const dto: CreatePessoaContatoDto = {
      tipoTelefone: 'RESIDENCIAL',
      telefone: '1122334455',
    };

    const result = CreateContatoMapper.toExternal(dto);

    expect(result).toEqual({
      tipoTelefone: 'RESIDENCIAL',
      telefone: '1122334455',
    });
    expect(result).not.toHaveProperty('contatoPrincipal');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('observacao');
  });
});