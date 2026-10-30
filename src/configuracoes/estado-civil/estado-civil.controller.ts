import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EstadoCivilService } from './estado-civil.service.js';
import { ApiTags } from '@nestjs/swagger';
import { CreateEstadoCivilDto } from './dto/create-estado-civil.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';

@ApiTags('Estado Civil')
@UseGuards(AuthGuard, RoleGuard)
@Controller('estado-civil')
export class EstadoCivilController {
  constructor(private readonly estadoCivilService: EstadoCivilService) { }

  @Get()
  findAll() {
    return this.estadoCivilService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.estadoCivilService.findOne(id);
  }

  @Post()
  create(@Body() createEstadoCivilDto: CreateEstadoCivilDto) {
    return this.estadoCivilService.create(createEstadoCivilDto);
  }
}
