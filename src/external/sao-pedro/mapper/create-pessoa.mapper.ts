import { CreatePessoaDto } from 'src/pessoa/dto/create-pessoa.dto.js';
import { ExternalCreatePessoaDto } from '../dto/external-create-pessoa.dto.js';
import { SEXO_ENUM } from 'src/commons/enums/enums.js';

export class CreatePessoaMapper {
  static toExternal(createPessoaDto: CreatePessoaDto): ExternalCreatePessoaDto {
    return {
      nome: createPessoaDto.nome,
      conhecidoPor: createPessoaDto.conhecidoPor,
      nacionalidade: createPessoaDto.nacionalidade,
      cpf: createPessoaDto.cpf,
      sexo: createPessoaDto.sexo === SEXO_ENUM.MASCULINO ? 'M' : 'F',
      dataNascimento: createPessoaDto.dataNascimento,
      estadoCivil:
        createPessoaDto.estadoCivil.substring(0, 1).toUpperCase() || 'N',
      escolaridade: createPessoaDto.escolaridade,
      foto: createPessoaDto.foto || null,
      ativo: true,
    };
  }
}
