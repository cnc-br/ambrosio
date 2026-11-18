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
import { EnderecoService } from './endereco.service.js';
import { CreateEnderecoDto } from './dto/create-endereco.dto.js';
import { UpdateEnderecoDto } from './dto/update-endereco.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard.js';
import { CurrentUser } from 'src/auth/current-user.decorator.js';

@ApiTags('Endereços')
@Controller('endereco')
export class EnderecoController {
  constructor(private readonly enderecoService: EnderecoService) {}

  @Post('/pessoa/:id')
  @UseGuards(OptionalAuthGuard)
  createByPessoaId(
    @Body() createEnderecoDto: CreateEnderecoDto,
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.enderecoService.createByPessoaId(
      createEnderecoDto,
      +id,
      userId,
    );
  }

  @Get('pessoa/:id')
  findAll(@Param('id') id: string) {
    return this.enderecoService.findAllByPessoaId(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enderecoService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(OptionalAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateEnderecoDto: UpdateEnderecoDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.enderecoService.update(+id, updateEnderecoDto, undefined, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enderecoService.remove(+id);
  }
}
