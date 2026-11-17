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
import { LocalidadeService } from './localidade.service.js';
import { CreateLocalidadeDto } from './dto/create-localidade.dto.js';
import { UpdateLocalidadeDto } from './dto/update-localidade.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@ApiTags('Localidades do caminho')
@UseGuards(AuthGuard, RoleGuard)
@Controller('localidade')
export class LocalidadeController {
  constructor(private readonly localidadeService: LocalidadeService) {}

  @Post()
  create(
    @Body() createLocalidadeDto: CreateLocalidadeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.localidadeService.create(createLocalidadeDto, userId);
  }

  @Get()
  findAll() {
    return this.localidadeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.localidadeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLocalidadeDto: UpdateLocalidadeDto,
  ) {
    return this.localidadeService.update(+id, updateLocalidadeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.localidadeService.remove(+id);
  }
}
