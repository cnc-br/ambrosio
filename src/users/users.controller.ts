import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AdicionarParoquiasAoUsuarioDto } from './dto/adicionar-paroquias-ao-usuario.dto.js';
import { AdicionarRegioesAoUsuarioDto } from './dto/adicionar-regioes-ao-usuario.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import type { user } from 'src/prisma/generated-client.js';

@ApiTags('Usuários')
@UseGuards(AuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Cria um usuário',
    description:
      'Cria um usuário vinculado a uma pessoa existente, localizada pelo CPF. ' +
      'O usuário é criado como NAO_IDENTIFICADO e inativo.',
  })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Payload inválido ou e-mail já cadastrado.',
  })
  @ApiNotFoundResponse({
    description: 'Pessoa não encontrada para o CPF informado.',
  })
  @ApiConflictResponse({
    description: 'A pessoa informada já possui um usuário vinculado.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de create user.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os usuários' })
  @ApiOkResponse({ description: 'Lista de usuários no envelope padrão da API.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de read user.' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário autenticado' })
  @ApiOkResponse({ description: 'Dados do usuário autenticado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  getMe(@CurrentUser() user: user) {
    return user;
  }

  @Get('roles')
  @ApiOperation({ summary: 'Lista os papéis disponíveis' })
  @ApiOkResponse({ description: 'Lista de papéis do sistema.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Busca um usuário pelo ID',
    description:
      'Retorna o usuário com a pessoa e as paróquias vinculadas, sem dados sensíveis.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID do usuário.' })
  @ApiOkResponse({ description: 'Usuário encontrado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiParam({ name: 'id', type: String, description: 'ID do usuário.' })
  @ApiOkResponse({ description: 'Usuário atualizado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de update user.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/paroquias')
  @ApiOperation({
    summary: 'Substitui as paróquias vinculadas ao usuário',
    description:
      'Remove os vínculos anteriores e cria exatamente as paróquias informadas em paroquiaIds.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID do usuário.' })
  @ApiOkResponse({ description: 'Vínculos de paróquia substituídos.' })
  @ApiBadRequestResponse({ description: 'Payload inválido.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de update user.' })
  adicionarParoquiasAoUsuario(
    @Param('id') id: string,
    @Body() adicionarParoquiasAoUsuarioDto: AdicionarParoquiasAoUsuarioDto,
  ) {
    return this.usersService.adicionarParoquiasAoUsuario(
      id,
      adicionarParoquiasAoUsuarioDto.paroquiaIds,
    );
  }

  @Patch(':id/regioes')
  @ApiOperation({
    summary: 'Substitui as regiões vinculadas ao usuário',
    description:
      'Remove os vínculos anteriores e cria exatamente as regiões informadas em regiaoIds. ' +
      'Uma lista vazia remove todas as regiões do usuário.',
  })
  @ApiParam({ name: 'id', type: String, description: 'ID do usuário.' })
  @ApiOkResponse({ description: 'Vínculos de região substituídos.' })
  @ApiBadRequestResponse({
    description: 'regiaoIds não é um array de inteiros positivos únicos.',
  })
  @ApiNotFoundResponse({
    description: 'Usuário não encontrado ou região inexistente.',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de update user.' })
  adicionarRegioesAoUsuario(
    @Param('id') id: string,
    @Body() adicionarRegioesAoUsuarioDto: AdicionarRegioesAoUsuarioDto,
  ) {
    return this.usersService.adicionarRegioesAoUsuario(
      id,
      adicionarRegioesAoUsuarioDto.regiaoIds,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Exclui um usuário' })
  @ApiParam({ name: 'id', type: String, description: 'ID do usuário.' })
  @ApiNoContentResponse({ description: 'Usuário excluído com sucesso.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  @ApiForbiddenResponse({ description: 'Usuário sem permissão de delete user.' })
  async remove(@Param('id') id: string, @Res() res: Response) {
    await this.usersService.remove(id);
    res.status(HttpStatus.NO_CONTENT).end();
  }
}
