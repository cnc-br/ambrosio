import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import type { user } from 'src/prisma/generated-client.js';
import { FindAllExecutionsQueryDto } from './dto/find-all-executions-query.dto.js';
import { MaintenanceService } from './maintenance.service.js';

@ApiTags('Manutenção')
@UseGuards(AuthGuard, RoleGuard)
@Controller('maintenance')
export class MaintenanceController {
  private readonly logger = new Logger(MaintenanceController.name);

  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly abilityService: CaslAbilityService,
  ) {}

  @Get('executions')
  @RequiredRoles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Lista o histórico de execuções de jobs de manutenção',
    description:
      'Retorna as execuções da mais recente para a mais antiga, com paginação.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Página do histórico. Padrão: 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de registros por página. Padrão: 50.',
  })
  @ApiOkResponse({ description: 'Histórico retornado com paginação.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({
    description: 'Usuário sem o papel ADMIN ou sem permissão CASL.',
  })
  findAll(
    @CurrentUser() user: user,
    @Query() query: FindAllExecutionsQueryDto,
  ) {
    this.authorize(user, 'read');
    return this.maintenanceService.findAll(query.page, query.limit);
  }

  @Delete('executions')
  @RequiredRoles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Exclui o histórico de execuções de jobs de manutenção',
    description:
      'Operação destrutiva: remove somente os registros históricos concluídos ' +
      '(SUCCESS e FAILED). Execuções em andamento (RUNNING) são preservadas e ' +
      'nenhum dado de negócio é alterado.',
  })
  @ApiOkResponse({
    description:
      'Quantidade de registros históricos excluídos, dentro do envelope de paginação.',
    schema: {
      type: 'object',
      properties: {
        server: {
          type: 'string',
          example: '127.0.0.1/maintenance/executions',
        },
        total: { type: 'number', example: 1 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 1 },
        data: {
          type: 'object',
          properties: {
            deleted: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({
    description: 'Usuário sem o papel ADMIN ou sem permissão CASL.',
  })
  removeHistory(@CurrentUser() user: user) {
    this.authorize(user, 'delete');
    return this.maintenanceService.deleteHistory();
  }

  /**
   * A checagem CASL fica no controller porque o `MaintenanceService` também é
   * consumido pelo job agendado e deve permanecer singleton (o
   * `CaslAbilityService` tem escopo de requisição).
   */
  private authorize(user: user, action: 'read' | 'delete'): void {
    if (!this.abilityService.ability.can(action, 'scheduledJobExecution')) {
      this.logger.warn(
        `Acesso negado ao histórico de manutenção (${action}) para o usuário ${user.id}.`,
      );
      const descricao = action === 'read' ? 'ler' : 'excluir';
      throw new ForbiddenException(
        `Você não tem permissão para ${descricao} o histórico de manutenção.`,
      );
    }
  }
}
