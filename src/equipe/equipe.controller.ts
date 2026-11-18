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
import { EquipeService } from './equipe.service.js';
import { CreateEquipeDto } from './dto/create-equipe.dto.js';
import { UpdateEquipeDto } from './dto/update-equipe.dto.js';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@Controller('equipe')
@ApiTags('Equipe')
@UseGuards(AuthGuard, RoleGuard)
export class EquipeController {
  constructor(private readonly equipeService: EquipeService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Equipe criada com sucesso.' })
  create(
    @Body() createEquipeDto: CreateEquipeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.equipeService.create(createEquipeDto, userId);
  }

  @Get()
  findAll() {
    return this.equipeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.equipeService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEquipeDto: UpdateEquipeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.equipeService.update(+id, updateEquipeDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.equipeService.remove(+id);
  }
}
