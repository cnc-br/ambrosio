import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class MacroRegiaoDto {
  @IsNumber()
  @IsPositive()
  id: number;
}

export class CreateRegiaoDto {
  @IsString()
  @MaxLength(100)
  descricao: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => MacroRegiaoDto)
  macroRegiao: MacroRegiaoDto;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
