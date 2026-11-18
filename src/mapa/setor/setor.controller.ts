import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRoleEnum } from 'neocatecumenal';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { RequiredRoles } from 'src/auth/required-roles.decorator.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CreateSetorDto } from './dto/create-setor.dto.js';
import { UpdateSetorDto } from './dto/update-setor.dto.js';
import { SetorService } from './setor.service.js';

@Controller('setor')
export class SetorController {
  constructor(private readonly setorService: SetorService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  create(
    @Body() createSetorDto: CreateSetorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.setorService.create(createSetorDto, userId);
  }

  @Get()
  findAll(@Query('regiaoId') regiaoId?: string) {
    const regiaoIdNumber = regiaoId ? +regiaoId : undefined;
    return this.setorService.findAll(regiaoIdNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.setorService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @RequiredRoles(UserRoleEnum.ADMIN, UserRoleEnum.SECRETARIA_CNC)
  update(
    @Param('id') id: string,
    @Body() updateSetorDto: UpdateSetorDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.setorService.update(+id, updateSetorDto, userId);
  }
}
