import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePessoaContatoDto {
  @IsOptional()
  @IsString()
  telefoneResidencial?: string;

  @IsOptional()
  @IsString()
  telefoneCelular?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  contatoPrincipal?: boolean;
}