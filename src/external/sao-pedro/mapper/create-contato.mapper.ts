import { CreatePessoaContatoDto } from 'src/pessoa/dto/create-pessoa-contato.dto.js';
import { ExternalCreateContatoDto } from '../dto/external-create-contato.dto.js';

export class CreateContatoMapper {
  static toExternal(dto: CreatePessoaContatoDto): ExternalCreateContatoDto {
    const external: ExternalCreateContatoDto = {};

    if (dto.tipoTelefone !== undefined) external.tipoTelefone = dto.tipoTelefone;
    if (dto.telefone !== undefined) external.telefone = dto.telefone;
    if (dto.email !== undefined) external.email = dto.email;
    if (dto.observacao !== undefined) external.observacao = dto.observacao;
    if (dto.contatoPrincipal !== undefined) {
      external.contatoPrincipal = dto.contatoPrincipal;
    }

    return external;
  }
}