import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ParoquiaService } from './paroquia.service.js';
import { CreateParoquiaDto } from './dto/create-paroquia.dto.js';
import { UpdateParoquiaDto } from './dto/update-paroquia.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';
import { FindAllParoquiasQueryDto } from './dto/findAll-paroquia.dto.js';

@ApiTags('Paróquias')
@UseGuards(AuthGuard, RoleGuard)
@Controller('paroquia')
export class ParoquiaController {
  constructor(private readonly paroquiaService: ParoquiaService) {}

  @Post()
  create(
    @Body() createParoquiaDto: CreateParoquiaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paroquiaService.create(createParoquiaDto, userId);
  }

  @Get()
  findAll(@Query() query: FindAllParoquiasQueryDto) {
    return this.paroquiaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paroquiaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateParoquiaDto: UpdateParoquiaDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paroquiaService.update(+id, updateParoquiaDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paroquiaService.remove(+id);
  }
}
