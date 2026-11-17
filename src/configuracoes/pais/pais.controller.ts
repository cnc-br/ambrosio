import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaisService } from './pais.service.js';
import { CreatePaisDto } from './dto/create-pais.dto.js';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@Controller('pais')
export class PaisController {
  constructor(private readonly paisService: PaisService) {}

  @Post()
  @UseGuards(OptionalAuthGuard)
  create(
    @Body() createPaisDto: CreatePaisDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.paisService.create(createPaisDto, userId);
  }

  @Get()
  findAll() {
    return this.paisService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.paisService.findOne(+id);
  }
}
