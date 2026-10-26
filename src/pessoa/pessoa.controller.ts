import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PessoaService } from './pessoa.service.js';
import { CreatePessoaDto } from './dto/create-pessoa.dto.js';
import { UpdatePessoaDto } from './dto/update-pessoa.dto.js';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SexoQueryParamDto } from './dto/sexo.dto.js';
import { CreateCasalDto } from './dto/create-casal.dto.js';
import { CreatePessoaContatoDto } from './dto/create-pessoa-contato.dto.js';
import { AuthGuard } from 'src/auth/auth.guard.js';
import { RoleGuard } from 'src/auth/role/role.guard.js';
import { CasalService } from './casal/casal.service.js';
import { ContatoService } from './contato/contato.service.js';

@ApiTags('Pessoas')
@UseGuards(AuthGuard, RoleGuard)
@Controller('pessoa')
export class PessoaController {
  constructor(
    private readonly pessoaService: PessoaService,
    private readonly casalService: CasalService,
    private readonly contatoService: ContatoService,
  ) {}

  @Post()
  @ApiCreatedResponse({ description: 'Pessoa criada com sucesso.' })
  @ApiConflictResponse({
    description: 'O CPF ja registrado para {pessoa.nome} de id: {pessoa.id}',
  })
  @ApiBody({
    description: 'Dados para criação de uma pessoa',
    examples: {
      pessoa: {
        summary: 'Pessoa padrão',
        value: {
          nome: 'Maria Silva Santos',
          conhecidoPor: 'Maria',
          nacionalidade: 'brasileira',
          cpf: '12345678901',
          sexo: 'FEMININO',
          dataNascimento: '1994-02-23',
          estadoCivil: {
            id: 2,
            descricao: 'CASADO',
          },
          situacaoReligiosa: {
            id: 1,
            descricao: 'LEIGO',
          },
        },
      },
    },
  })
  create(@Body() createPessoaDto: CreatePessoaDto) {
    return this.pessoaService.create(createPessoaDto);
  }

  @Post('/casal')
  @ApiOkResponse({ description: 'Cria um casal' })
  @ApiBadRequestResponse({
    description: 'Não é possivel criar casais do mesmo sexo',
  })
  @ApiBody({
    description: 'Adicionar os casais use os seguintes parametros',
    examples: {
      casal: {
        summary: 'Casal padrão',
        value: {
          pessoaId: 1,
          conjugueId: 2,
        },
      },
    },
  })
  createCasal(@Body() createCasalDto: CreateCasalDto) {
    return this.casalService.createCasal(createCasalDto);
  }

  @Post('/:id/contato')
  @ApiCreatedResponse({ description: 'Contato criado com sucesso.' })
  @ApiBadRequestResponse({ description: 'Payload inválido' })
  @ApiNotFoundResponse({ description: 'Pessoa não encontrada' })
  @ApiBody({
    description: 'Dados para criação de um contato da pessoa',
    examples: {
      contato: {
        summary: 'Contato padrão',
        value: {
          telefoneResidencial: '1122334455',
          telefoneCelular: '11987654321',
          email: 'contato@exemplo.com',
          observacao: 'Contato principal',
          ativo: true,
          contatoPrincipal: true,
        },
      },
    },
  })
  createContato(
    @Param('id') id: string,
    @Body() createPessoaContatoDto: CreatePessoaContatoDto,
  ) {
    return this.contatoService.create(+id, createPessoaContatoDto);
  }

  @Get()
  @ApiOkResponse({ description: 'Lista todas as pessoas' })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos' })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('cpf') cpf?: string,
    @Query('externalId') externalId?: string,
  ) {
    if (cpf) {
      return this.pessoaService.findOneByCpf(cpf);
    } else if (externalId) {
      return this.pessoaService.findByExternalId(externalId);
    } else {
      return this.pessoaService.findAll(Number(page), Number(limit));
    }
  }

  @Get('/conjugue')
  @ApiOkResponse({ description: 'Lista todas as pessoas casadas por sexo' })
  @ApiBadRequestResponse({
    description: 'Parâmetros inválidos. Use `sexo` M ou F',
  })
  findAllConjugue(@Query() query: SexoQueryParamDto) {
    return this.casalService.findAllBySexoEstadoCivilCasado(
      query.sexo.toUpperCase(),
    );
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Busca uma pessoa pelo ID' })
  findOne(@Param('id') id: string) {
    return this.pessoaService.findOne(+id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Atualiza uma pessoa' })
  update(@Param('id') id: string, @Body() updatePessoaDto: UpdatePessoaDto) {
    return this.pessoaService.update(+id, updatePessoaDto);
  }
}
