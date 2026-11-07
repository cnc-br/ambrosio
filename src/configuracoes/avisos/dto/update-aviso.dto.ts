import { IsDateString, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UpdateAvisoDto {
  // Campo ausente (`undefined`) é permitido para atualização parcial.
  // `null` é inválido: o Prisma rejeita null em campos não anuláveis e a
  // exceção resultante vira 500, então null deve falhar na validação (400).
  @ValidateIf((_obj, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  texto?: string;

  @ValidateIf((_obj, value) => value !== undefined)
  @IsDateString()
  dataFim?: string;
}
