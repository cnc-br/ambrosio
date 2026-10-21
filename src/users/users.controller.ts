import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AdicionarParoquiasAoUsuarioDto } from './dto/adicionar-paroquias-ao-usuario.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import type { user } from 'src/prisma/generated-client.js';

@UseGuards(AuthGuard, RoleGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getMe(@CurrentUser() user: user) {
    return user;
  }

  @Get('roles')
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/paroquias')
  adicionarParoquiasAoUsuario(
    @Param('id') id: string,
    @Body() adicionarParoquiasAoUsuarioDto: AdicionarParoquiasAoUsuarioDto,
  ) {
    return this.usersService.adicionarParoquiasAoUsuario(
      id,
      adicionarParoquiasAoUsuarioDto.paroquiaIds,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
