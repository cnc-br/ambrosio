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
import { CarismaService } from './carisma.service.js';
import { CreateCarismaDto } from './dto/create-carisma.dto.js';
import { UpdateCarismaDto } from './dto/update-carisma.dto.js';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateCarismaDaPessoaDto } from './dto/create-carisma-da-pessoa.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';

@ApiTags('Carisma')
@UseGuards(AuthGuard, RoleGuard)
@Controller('carismas')
export class CarismaController {
  constructor(private readonly carismaService: CarismaService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Carisma criado com sucesso.' })
  create(@Body() createCarismaDto: CreateCarismaDto) {
    return this.carismaService.create(createCarismaDto);
  }

  @Post('pessoa/:pessoaId')
  @ApiCreatedResponse({
    description: 'Carismas adicionados à pessoa com sucesso.',
  })
  @ApiForbiddenResponse({
    description: 'Pessoa fora das paróquias do usuário ou sem permissão.',
  })
  @ApiNotFoundResponse({
    description: 'Pessoa não encontrada.',
  })
  addCarismaToPessoa(
    @Param('pessoaId') pessoaId: string,
    @Body() createCarismaDto: CreateCarismaDaPessoaDto,
  ) {
    return this.carismaService.addCarismaToPessoa(+pessoaId, createCarismaDto);
  }

  @Get('equipe')
  @ApiOkResponse({
    description:
      'Retorna todas as pessoas que possuem carismas para formar uma equipe especializada em algum seviço: Ex: Pos Crisma, Catequitas, Familia Missão, etc.',
  })
  findPessoasComCarismas() {
    return this.carismaService.findAllPessoaComCarismaParaEquipe();
  }

  @Get()
  findAll() {
    return this.carismaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carismaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCarismaDto: UpdateCarismaDto) {
    return this.carismaService.update(+id, updateCarismaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carismaService.remove(+id);
  }
}
