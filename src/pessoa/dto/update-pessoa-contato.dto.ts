import { PartialType } from '@nestjs/mapped-types';
import { CreatePessoaContatoDto } from './create-pessoa-contato.dto.js';

export class UpdatePessoaContatoDto extends PartialType(
  CreatePessoaContatoDto,
) {}
