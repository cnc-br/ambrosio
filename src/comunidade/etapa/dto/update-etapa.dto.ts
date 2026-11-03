import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEtapaDto {
  @IsPositive({ message: 'O campo etapaId deve ser um número positivo.' })
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
