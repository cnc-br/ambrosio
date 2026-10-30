import {
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEstadoCivilDto {

  @IsString()
  @MaxLength(20, {
    message: 'O estado civil não pode ter mais de 20 caracteres',
  })
  descricao: string;
}
