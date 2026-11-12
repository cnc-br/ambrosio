import { Injectable, NotFoundException } from '@nestjs/common';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { CreatePessoaContatoDto } from '../dto/create-pessoa-contato.dto.js';
import { UpdatePessoaContatoDto } from '../dto/update-pessoa-contato.dto.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { PessoaService } from '../pessoa.service.js';

@Injectable()
export class ContatoService extends BaseService {
  constructor(
    private readonly pessoaService: PessoaService,
    private readonly saoPedroContatoService: SaoPedroContatoService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(pessoaId: number, createPessoaContatoDto: CreatePessoaContatoDto) {
    this.validateCreateAbility('pessoa');

    const pessoa =
      await this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(
        pessoaId,
      );

    return this.saoPedroContatoService.createExternalContato(
      pessoa.externalId,
      createPessoaContatoDto,
    );
  }

  async update(
    pessoaId: number,
    contatoId: string,
    updatePessoaContatoDto: UpdatePessoaContatoDto,
  ) {
    this.validateUpdateAbility('pessoa');

    const pessoa =
      await this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(
        pessoaId,
      );

    const contatos = await this.saoPedroContatoService.findExternalContatos(
      pessoa.externalId,
    );

    const contato = contatos.find((c) => String(c.id) === contatoId);

    if (!contato) {
      throw new NotFoundException(
        "O registro de 'Contato' não foi encontrado.",
      );
    }

    return this.saoPedroContatoService.updateExternalContato(
      contatoId,
      updatePessoaContatoDto,
    );
  }
}