import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { EtapaComunidadeService } from './etapa-comunidade.service.js';
import { CreateEtapaDto } from './dto/create-etapa.dto.js';
import { UpdateEtapaDto } from './dto/update-etapa.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@ApiTags('Etapa da Comunidade')
@UseGuards(AuthGuard, RoleGuard)
@Controller('comunidade/:comunidadeId/etapa')
export class EtapaComunidadeController {
  constructor(private readonly etapaService: EtapaComunidadeService) { }

  @Post()
  create(
    @Param(
      'comunidadeId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    comunidadeId: number,
    @Body() createEtapaDto: CreateEtapaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.etapaService.create(comunidadeId, createEtapaDto, userId);
  }

  @Get()
  findAll(
    @Param(
      'comunidadeId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    comunidadeId: number,
  ) {
    return this.etapaService.findAll(comunidadeId);
  }

  @Get(':id')
  findOne(
    @Param(
      'comunidadeId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    comunidadeId: number,
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: number,
  ) {
    return this.etapaService.findOne(comunidadeId, id);
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: number,
    @Body() updateEtapaDto: UpdateEtapaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.etapaService.update(id, updateEtapaDto, userId);
  }

  @Delete(':id')
  remove(
    @Param(
      'comunidadeId',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    comunidadeId: number,
    @Param(
      'id',
      new ParseIntPipe({
        errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE,
      }),
    )
    id: number,
  ) {
    return this.etapaService.remove(comunidadeId, id);
  }
}
