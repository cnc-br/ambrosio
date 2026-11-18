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

class RegiaoDto {
  @IsNumber()
  @IsPositive()
  id: number;
}

export class CreateSetorDto {
  @IsString()
  @MaxLength(50)
  descricao: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => RegiaoDto)
  regiao: RegiaoDto;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
