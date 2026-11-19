import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CreateMacroRegiaoDto } from './dto/create-macro-regiao.dto.js';
import { UpdateMacroRegiaoDto } from './dto/update-macro-regiao.dto.js';
import { MacroRegiaoService } from './macro-regiao.service.js';

@Controller('macro-regiao')
export class MacroRegiaoController {
  constructor(private readonly macroRegiaoService: MacroRegiaoService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  create(
    @Body() createMacroRegiaoDto: CreateMacroRegiaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.macroRegiaoService.create(createMacroRegiaoDto, userId);
  }

  @Get()
  findAll() {
    return this.macroRegiaoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.macroRegiaoService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  update(
    @Param('id') id: string,
    @Body() updateMacroRegiaoDto: UpdateMacroRegiaoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.macroRegiaoService.update(+id, updateMacroRegiaoDto, userId);
  }
}
