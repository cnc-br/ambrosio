import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateAvisoDto {
  @IsString()
  @IsNotEmpty()
  texto: string;

  @IsDateString()
  dataFim: string;
}
