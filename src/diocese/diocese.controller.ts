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
import { DioceseService } from './diocese.service.js';
import { CreateDioceseDto } from './dto/create-diocese.dto.js';
import { UpdateDioceseDto } from './dto/update-diocese.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@UseGuards(AuthGuard, RoleGuard)
@ApiTags('Diocese')
@Controller('diocese')
export class DioceseController {
  constructor(private readonly dioceseService: DioceseService) {}

  @Post()
  create(
    @Body() createDioceseDto: CreateDioceseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dioceseService.create(createDioceseDto, userId);
  }

  @Get()
  findAll() {
    return this.dioceseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dioceseService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDioceseDto: UpdateDioceseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.dioceseService.update(+id, updateDioceseDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dioceseService.remove(+id);
  }
}
