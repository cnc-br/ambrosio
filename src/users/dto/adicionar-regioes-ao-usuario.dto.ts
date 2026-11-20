import { ArrayUnique, IsArray, IsInt, IsPositive } from 'class-validator';

export class AdicionarRegioesAoUsuarioDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @IsPositive({ each: true })
  regiaoIds: number[];
}
