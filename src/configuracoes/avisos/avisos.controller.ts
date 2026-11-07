import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { AvisosService } from './avisos.service.js';
import { CreateAvisoDto } from './dto/create-aviso.dto.js';
import { UpdateAvisoDto } from './dto/update-aviso.dto.js';

@ApiTags('Avisos')
@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Cadastra um aviso',
    description:
      'Cria um aviso com texto e data de término. Restrito ao papel ADMIN.',
  })
  @ApiCreatedResponse({ description: 'Aviso criado com sucesso.' })
  @ApiBadRequestResponse({
    description:
      'Payload inválido: texto obrigatório (não vazio) e dataFim em ISO-8601.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem o papel ADMIN.' })
  create(@Body() createAvisoDto: CreateAvisoDto) {
    return this.avisosService.create(createAvisoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista os avisos',
    description:
      'Público, sem autenticação. Retorna todos os avisos cadastrados ' +
      '(pode conter mais de um aviso) no envelope padrão da API, ordenados ' +
      'por data de término decrescente.',
  })
  @ApiOkResponse({ description: 'Lista de avisos retornada no envelope padrão.' })
  findAll() {
    return this.avisosService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um aviso pelo ID',
    description: 'Público, sem autenticação. Retorna o aviso com o id informado.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do aviso.' })
  @ApiOkResponse({ description: 'Aviso encontrado.' })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos.',
  })
  @ApiNotAcceptableResponse({ description: 'ID não numérico.' })
  @ApiNotFoundResponse({ description: 'Aviso não encontrado.' })
  findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    return this.avisosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Atualiza um aviso',
    description:
      'Atualiza o texto e/ou a data de término de um aviso existente. ' +
      'Restrito ao papel ADMIN.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID do aviso.' })
  @ApiOkResponse({ description: 'Aviso atualizado com sucesso.' })
  @ApiBadRequestResponse({
    description:
      'Payload inválido: campos não aceitam null e dataFim deve ser ISO-8601.',
  })
  @ApiNotAcceptableResponse({ description: 'ID não numérico.' })
  @ApiNotFoundResponse({ description: 'Aviso não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem o papel ADMIN.' })
  update(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() updateAvisoDto: UpdateAvisoDto,
  ) {
    return this.avisosService.update(id, updateAvisoDto);
  }
}
