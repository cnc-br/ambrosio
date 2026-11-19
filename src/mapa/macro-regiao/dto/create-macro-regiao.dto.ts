import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMacroRegiaoDto {
  @IsString()
  @MaxLength(50)
  descricao: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
