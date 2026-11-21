import {
  Controller,
  ForbiddenException,
  Get,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import type { user } from 'src/prisma/generated-client.js';
import { DashboardService } from './dashboard.service.js';
import {
  CarismasIndicadorDto,
  DashboardIndicadoresDto,
  PessoasIndicadorDto,
  UsuariosIndicadorDto,
} from './dto/dashboard-response.dto.js';

@ApiTags('Dashboard')
@ApiExtraModels(
  DashboardIndicadoresDto,
  PessoasIndicadorDto,
  CarismasIndicadorDto,
  UsuariosIndicadorDto,
)
@UseGuards(AuthGuard, RoleGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly abilityService: CaslAbilityService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Retorna os indicadores agregados do dashboard',
    description:
      'Números globais da base, calculados sob demanda e cacheados por até ' +
      '60 segundos. Não aplica recorte por paróquia ou região.',
  })
  @ApiOkResponse({
    description: 'Indicadores retornados no envelope padrão da API.',
    schema: {
      type: 'object',
      properties: {
        server: { type: 'string', example: '127.0.0.1/dashboard' },
        total: { type: 'number', example: 1 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 1 },
        data: { $ref: getSchemaPath(DashboardIndicadoresDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({
    description: 'Usuário sem permissão de leitura de pessoa.',
  })
  getIndicators(@CurrentUser() user: user) {
    this.authorize(user);
    return this.dashboardService.getIndicators();
  }

  /**
   * A checagem CASL fica no controller porque o `CaslAbilityService` tem escopo
   * de requisição, enquanto o `DashboardService` é singleton (cache em memória).
   */
  private authorize(user: user): void {
    if (!this.abilityService.ability.can('read', 'pessoa')) {
      this.logger.warn(`Acesso negado ao dashboard para o usuário ${user.id}.`);
      throw new ForbiddenException(
        'Você não tem permissão para acessar o dashboard.',
      );
    }
  }
}
