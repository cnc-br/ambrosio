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
import { ApiTags } from '@nestjs/swagger';
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
  create(@Body() createAvisoDto: CreateAvisoDto) {
    return this.avisosService.create(createAvisoDto);
  }

  @Get()
  findAll() {
    return this.avisosService.findAll();
  }

  @Get(':id')
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
