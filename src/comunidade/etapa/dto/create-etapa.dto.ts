import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CreateEtapaDto {
  @IsPositive()
  etapaId: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  equipeId?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataInicio?: Date;

  @IsOptional()
  @MaxLength(180)
  localConvivencia?: string;

  @IsOptional()
  @MaxLength(250)
  observacao?: string;
}
