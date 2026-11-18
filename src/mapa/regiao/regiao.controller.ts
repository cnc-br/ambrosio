import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CreateRegiaoDto } from './dto/create-regiao.dto.js';
import { UpdateRegiaoDto } from './dto/update-regiao.dto.js';
import { RegiaoService } from './regiao.service.js';

@ApiTags('Regiões')
@Controller('regiao')
export class RegiaoController {
  constructor(private readonly regiaoService: RegiaoService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  create(
    @Body() createRegiaoDto: CreateRegiaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.regiaoService.create(createRegiaoDto, userId);
  }

  @Get()
  @ApiOkResponse({ description: 'Retorna todas as regiões' })
  findAll() {
    return this.regiaoService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Retorna uma região pelo ID' })
  findOne(@Param('id') id: string) {
    const parsedId = Number(id);
    if (isNaN(parsedId) || !Number.isInteger(parsedId) || parsedId <= 0) {
      throw new BadRequestException(
        'O parâmetro "id" deve ser um número inteiro positivo válido.',
      );
    }
    return this.regiaoService.findOne(parsedId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  update(
    @Param('id') id: string,
    @Body() updateRegiaoDto: UpdateRegiaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.regiaoService.update(+id, updateRegiaoDto, userId);
  }
}
