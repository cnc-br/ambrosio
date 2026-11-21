import { ApiProperty } from '@nestjs/swagger';
import { roles } from 'src/prisma/generated-client.js';

export class PessoasIndicadorDto {
  @ApiProperty({ description: 'Total de pessoas cadastradas.', example: 100 })
  total: number;

  @ApiProperty({ description: 'Pessoas com `ativo = true`.', example: 90 })
  ativas: number;

  @ApiProperty({ description: 'Pessoas com `ativo = false`.', example: 10 })
  inativas: number;
}

export class CarismasIndicadorDto {
  @ApiProperty({ description: 'Total de carismas cadastrados.', example: 4 })
  total: number;

  @ApiProperty({
    description: 'Total de vínculos pessoa-carisma (não de pessoas distintas).',
    example: 15,
  })
  vinculos: number;
}

export class UsuariosIndicadorDto {
  @ApiProperty({ description: 'Total de usuários cadastrados.', example: 5 })
  total: number;

  @ApiProperty({
    description:
      'Quantidade de usuários por papel, incluindo papéis sem usuários.',
    example: Object.fromEntries(
      Object.values(roles).map((papel) => [papel, 0]),
    ),
  })
  porPapel: Record<roles, number>;
}

export class DashboardIndicadoresDto {
  @ApiProperty({ type: PessoasIndicadorDto })
  pessoas: PessoasIndicadorDto;

  @ApiProperty({ description: 'Total de paróquias.', example: 12 })
  paroquias: number;

  @ApiProperty({ description: 'Total de dioceses.', example: 2 })
  dioceses: number;

  @ApiProperty({ description: 'Total de comunidades.', example: 30 })
  comunidades: number;

  @ApiProperty({ description: 'Total de equipes.', example: 8 })
  equipes: number;

  @ApiProperty({ type: CarismasIndicadorDto })
  carismas: CarismasIndicadorDto;

  @ApiProperty({ type: UsuariosIndicadorDto })
  usuarios: UsuariosIndicadorDto;
}
