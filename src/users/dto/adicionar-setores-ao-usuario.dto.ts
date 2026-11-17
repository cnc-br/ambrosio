import { ArrayUnique, IsArray, IsInt, IsPositive } from 'class-validator';

export class AdicionarSetoresAoUsuarioDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  setorIds: number[];
}
