import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
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
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { FindAllExecutionsQueryDto } from './dto/find-all-executions-query.dto.js';
import { MaintenanceService } from './maintenance.service.js';

@ApiTags('Manutenção')
@UseGuards(AuthGuard, RoleGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

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
  @ApiForbiddenResponse({ description: 'Usuário sem o papel ADMIN.' })
  findAll(@Query() query: FindAllExecutionsQueryDto) {
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
    description: 'Quantidade de registros históricos excluídos.',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number', example: 10 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem o papel ADMIN.' })
  removeHistory() {
    return this.maintenanceService.deleteHistory();
  }
}
