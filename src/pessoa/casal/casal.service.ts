import { HttpException, Injectable } from '@nestjs/common';
import { EstadoCivilEnum, Pessoa } from 'neocatecumenal';
import { BaseService } from 'src/commons/base.service.js';
import { SEXO_ENUM } from 'src/commons/enums/enums.js';
import { PrismaService } from 'src/prisma.service.js';
import { Prisma } from 'src/prisma/generated-client.js';
import { CreateCasalDto } from '../dto/create-casal.dto.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { serializePessoasListResponse } from '../pessoa.serializer.js';
import { ComunidadeService } from 'src/comunidade/comunidade.service.js';
import { PessoaService } from '../pessoa.service.js';

@Injectable()
export class CasalService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly saoPedroPessoaService: SaoPedroPessoaService,
    private readonly comunidadeService: ComunidadeService,
    private readonly pessoaService: PessoaService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async createCasal(createCasalDto: CreateCasalDto) {
    this.validateCreateAbility('pessoa');
    const pessoaId = createCasalDto.pessoaId;
    const conjugueId = createCasalDto.conjugueId;

    await Promise.all([
      this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(pessoaId),
      this.pessoaService.validarPessoaDentroDoEscopoDeAtualizacao(conjugueId),
    ]);

    const [pessoa, conjugue] = await Promise.all([
      this.prisma.pessoa.findUniqueOrThrow({
        where: { id: pessoaId },
      }),
      this.prisma.pessoa.findUniqueOrThrow({
        where: { id: conjugueId },
      }),
    ]);

    const [pessoaExternal, conjugueExternal] = await Promise.all([
      this.saoPedroPessoaService.findExternalPessoaByUuid(pessoa.externalId),
      this.saoPedroPessoaService.findExternalPessoaByUuid(conjugue.externalId),
    ]);

    await this.validateMarriageEligibility(
      pessoaExternal,
      conjugueExternal,
      pessoa.id,
      conjugue.id,
    );

    let pessoaMaridoId: number;
    let pessoaMulherId: number;

    if (pessoaExternal.sexo === SEXO_ENUM.MASCULINO.substring(0, 1)) {
      pessoaMaridoId = pessoa.id;
      pessoaMulherId = conjugue.id;
    } else if (pessoaExternal.sexo === SEXO_ENUM.FEMININO.substring(0, 1)) {
      pessoaMaridoId = conjugue.id;
      pessoaMulherId = pessoa.id;
    } else {
      this.logger.error(
        `Sexo inválido para pessoa ID ${pessoa.id} ou conjugue ID ${conjugue.id}`,
      );
      throw new HttpException(
        'Marido ou esposa esta com os sexo (F ou M) cadastrado de forma errada. Verificar.',
        400,
      );
    }

    const casal = await this.prisma.pessoaCasal.create({
      data: { pessoaMaridoId, pessoaMulherId },
    });

    await this.juntarCasalNaMesmaComunidade(conjugue.id, pessoa.id);
    return casal;
  }

  async findAllBySexoEstadoCivilCasado(sexo: string) {
    this.validateReadAbility('pessoa');

    // Função para buscar todas as pessoas com estado civil casado que não estão vinculadas como marido e mulher
    const param = sexo === 'M' ? SEXO_ENUM.MASCULINO : SEXO_ENUM.FEMININO;
    const externalPessoas =
      await this.saoPedroPessoaService.getExternalPessoasEstadoCivilCasado(
        param,
      );

    if (externalPessoas.length === 0) {
      return [];
    }

    const externalIds = externalPessoas.map((pessoa) => pessoa.externalId);

    const { ability, userId } = this.abilityService;
    const escopoParoquia: Prisma.pessoaWhereInput = ability.can(
      'manage',
      'all',
    )
      ? {}
      : {
          comunidadePessoas: {
            some: {
              dataSaida: null,
              comunidade: {
                is: {
                  paroquia: {
                    is: {
                      usuarioParoquias: { some: { userId } },
                    },
                  },
                },
              },
            },
          },
        };

    const pessoas = await this.prisma.pessoa.findMany({
      select: {
        id: true,
        externalId: true,
      },
      where: {
        externalId: {
          in: externalIds,
        },
        AND: [
          {
            casamentosComoMarido: {
              none: {},
            },
          },
          {
            casamentosComoMulher: {
              none: {},
            },
          },
          escopoParoquia,
        ],
      },
    });

    return serializePessoasListResponse(pessoas, externalPessoas, undefined);
  }

  private async juntarCasalNaMesmaComunidade(
    conjugueId: number,
    pessoaId: number,
  ) {
    const comunidadeConjugueId =
      await this.comunidadeService.findByPessoaId(conjugueId);
    if (comunidadeConjugueId) {
      this.logger.log(
        `Adicionando pessoa ID ${pessoaId} à comunidade ID ${comunidadeConjugueId} do conjugue ID ${conjugueId}`,
      );
      await this.comunidadeService.adicionarPessoa(
        comunidadeConjugueId,
        pessoaId,
      );
    }
  }

  private async validateMarriageEligibility(
    pessoaExternal: Pessoa,
    conjugueExternal: Pessoa,
    pessoaId: number,
    conjugueId: number,
  ) {
    if (
      pessoaExternal.estadoCivil !== EstadoCivilEnum.CASADO.substring(0, 1) ||
      conjugueExternal.estadoCivil !== EstadoCivilEnum.CASADO.substring(0, 1)
    ) {
      throw new HttpException(
        'Apenas pessoas com estado civil casado podem se casar',
        400,
      );
    }

    if (pessoaExternal.sexo === conjugueExternal.sexo) {
      throw new HttpException(
        'Casal do mesmo sexo! Não existe casal do mesmo sexo. Verificar.',
        400,
      );
    }

    const existingConjugue = await this.prisma.pessoaCasal.findFirst({
      where: {
        OR: [
          {
            pessoaMaridoId: pessoaId,
          },
          {
            pessoaMaridoId: conjugueId,
          },
          {
            pessoaMulherId: pessoaId,
          },
          {
            pessoaMulherId: conjugueId,
          },
        ],
      },
    });

    if (existingConjugue) {
      throw new HttpException(
        'Marido ou mulher já está em outro relacionamento.',
        400,
      );
    }
  }
}
