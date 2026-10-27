import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TIPO_TELEFONE_ENUM } from 'src/commons/enums/enums.js';

export class CreatePessoaContatoDto {
  @IsOptional()
  @IsEnum(TIPO_TELEFONE_ENUM)
  tipoTelefone?: TIPO_TELEFONE_ENUM;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsBoolean()
  contatoPrincipal?: boolean;
}