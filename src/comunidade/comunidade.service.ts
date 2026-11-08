import { ForbiddenException, Injectable } from '@nestjs/common';
import { accessibleBy } from '@casl/prisma';
import { UpdateComunidadeDto } from './dto/update-comunidade.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { Comunidade } from 'neocatecumenal';
import { Prisma } from 'src/prisma/generated-client.js';
import { HistoricoService } from './historico/historico.service.js';
import {
  ENDERECO_INCLUDE,
  PESSOA_CARISMA_INCLUDE,
} from 'src/prisma/includes.js';
import serializeComunidadeResponse, {
  MapaPessoasExternas,
} from './comunidade.serialize.js';
import { CreateComunidadeDto } from './dto/create-comunidade.dto.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';

@Injectable()
export class ComunidadeService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private readonly historicoService: HistoricoService,
    protected readonly abilityService: CaslAbilityService,
    private readonly saoPedroPessoaService: SaoPedroPessoaService,
  ) {
    super(abilityService);
  }

  async create(createComunidadeDto: CreateComunidadeDto) {
    this.validateCreateAbility('comunidade');

    const createScope = accessibleBy(
      this.abilityService.ability,
      'create',
    ).comunidade;

    const paroquia = await this.prisma.paroquia.findFirst({
      where: {
        AND: [
          { id: createComunidadeDto.paroquiaId },
          this.condicaoEscopoDeParoquia(createScope),
        ],
      },
    });

    if (!paroquia) {
      // Distingue 404 (paróquia inexistente) de 403 (paróquia fora do escopo)
      await this.prisma.paroquia.findUniqueOrThrow({
        where: { id: createComunidadeDto.paroquiaId },
      });
      throw new ForbiddenException(
        'Você não tem permissão para cadastrar comunidade fora das suas paróquias.',
      );
    }

    const comunidade = await this.prisma.comunidade.create({
      data: {
        numeroDaComunidade: createComunidadeDto.numeroDaComunidade,
        quantidadeMembros: createComunidadeDto.quantidadeMembros,
        paroquiaId: paroquia.id,
        observacao: createComunidadeDto.observacao,
      },
    });

    try {
      await this.historicoService.create({
        comunidadeId: comunidade.id,
        numeroComunidade: comunidade.numeroDaComunidade,
        descricao: `Comunidade ${comunidade.numeroDaComunidade} cadastrada no sistema.`,
      });
    } catch (error) {
      await this.remove(comunidade.id);
      this.logger.error(
        `Erro ao criar historico para comunidade ${comunidade.numeroDaComunidade} - (ID: ${comunidade.id}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return await this.findOne(comunidade.id);
  }

  async findAll(paroquiaId?: number, numeroDaComunidade?: number) {
    this.validateReadAbility('comunidade');
    const where: Prisma.comunidadeWhereInput = {
      AND: [
        accessibleBy(this.abilityService.ability, 'read').comunidade,
        {
          ...(paroquiaId != null && { paroquiaId }),
          ...(numeroDaComunidade != null && { numeroDaComunidade }),
        },
      ],
    };

    const comunidades = await this.prisma.comunidade.findMany({
      where,
      include: {
        paroquia: {
          include: {
            endereco: ENDERECO_INCLUDE,
            diocese: {
              include: {
                tipoDiocese: true,
                endereco: ENDERECO_INCLUDE,
              },
            },
          },
        },
        etapa: true,
        comunidadeEtapas: {
          include: {
            etapa: true,
          },
        },
      },
      orderBy: { numeroDaComunidade: 'asc' },
    });
    return comunidades.map((comunidade) =>
      serializeComunidadeResponse(comunidade),
    );
  }

  async findByPessoaId(pessoaId: number): Promise<number | null> {
    this.validateReadAbility('comunidade');
    const comunidades = await this.prisma.comunidade.findMany({
      where: {
        comunidadePessoas: {
          some: {
            pessoaId,
          },
        },
      },
    });
    return comunidades.length > 0 ? comunidades[0].id : null;
  }

  async findOne(id: number): Promise<Comunidade> {
    this.validateReadAbility('comunidade');
    const comunidade = await this.prisma.comunidade.findFirstOrThrow({
      where: { id },
      include: {
        etapa: true,
        comunidadeEtapas: {
          include: {
            etapa: true,
            equipe: true,
          },
        },
        paroquia: {
          include: {
            diocese: {
              include: {
                tipoDiocese: true,
                endereco: ENDERECO_INCLUDE,
              },
            },
          },
        },
        comunidadePessoas: {
          include: {
            pessoa: {
              include: {
                pessoaCarismas: PESSOA_CARISMA_INCLUDE,
                casamentosComoMarido: {
                  include: {
                    mulher: {
                      select: { id: true, externalId: true },
                    },
                  },
                },
                casamentosComoMulher: {
                  include: {
                    marido: {
                      select: { id: true, externalId: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const mapaPessoas = await this.resolverNomesCarismas(comunidade);
    return serializeComunidadeResponse(comunidade, mapaPessoas);
  }

  /**
   * Coleta os `externalId` das pessoas vinculadas à comunidade (e dos
   * cônjuges via `pessoaCasal`) e resolve o `nome` na API externa São Pedro,
   * montando um mapa `externalId → { id, externalId, nome }`.
   */
  private async resolverNomesCarismas(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comunidade: any,
  ): Promise<MapaPessoasExternas> {
    const externalIds = new Set<string>();
    const pessoas = comunidade?.comunidadePessoas?.map(
      (v) => v?.pessoa,
    ) || [];

    for (const pessoa of pessoas) {
      if (!pessoa) continue;
      if (pessoa.externalId) externalIds.add(pessoa.externalId);

      const conjugueComoMarido = pessoa.casamentosComoMarido?.[0]?.mulher;
      const conjugueComoMulher = pessoa.casamentosComoMulher?.[0]?.marido;
      const conjugue = conjugueComoMarido ?? conjugueComoMulher;
      if (conjugue?.externalId) externalIds.add(conjugue.externalId);
    }

    const mapa: MapaPessoasExternas = new Map();
    await Promise.all(
      Array.from(externalIds).map(async (uuid) => {
        try {
          const pessoa = await this.saoPedroPessoaService.findExternalPessoaByUuid(
            uuid,
          );
          if (pessoa?.externalId) {
            mapa.set(pessoa.externalId, {
              id: pessoa.id,
              externalId: pessoa.externalId,
              nome: pessoa.nome,
            });
          }
        } catch (error) {
          this.logger.warn(
            `Não foi possível resolver nome externo da pessoa ${uuid} para carismas: ${error instanceof Error ? error.message : String(error)}
            }`,
          );
        }
      }),
    );

    return mapa;
  }

  async update(id: number, updateComunidadeDto: UpdateComunidadeDto) {
    this.validateUpdateAbility('comunidade');

    await this.validarComunidadeDentroDoEscopoDeAtualizacao(id);

    await this.historicoService.create({
      comunidadeId: id,
      numeroComunidade: updateComunidadeDto.numeroDaComunidade,
      descricao: `Comunidade com ${updateComunidadeDto.quantidadeMembros} membros.`,
    });

    return this.prisma.comunidade.update({
      where: { id },
      data: {
        numeroDaComunidade: updateComunidadeDto.numeroDaComunidade,
        quantidadeMembros: updateComunidadeDto.quantidadeMembros,
        observacao: updateComunidadeDto.observacao,
        etapaAtualId: updateComunidadeDto.etapaAtualId,
      },
    });
  }

  remove(id: number) {
    this.validateDeleteAbility('comunidade');
    this.logger.log(`Removendo comunidade de id ${id}`);
    return this.prisma.comunidade.delete({
      where: { id },
    });
  }

  async adicionarPessoa(comunidadeId: number, pessoaId: number) {
    this.validateUpdateAbility('comunidade');
    await this.validarComunidadeDentroDoEscopoDeAtualizacao(comunidadeId);
    return this.prisma.comunidadePessoa.create({
      data: {
        dataEntrada: new Date(),
        comunidadeId,
        pessoaId,
      },
    });
  }

  async removerPessoa(comunidadeId: number, pessoaId: number) {
    this.validateUpdateAbility('comunidade');
    await this.validarComunidadeDentroDoEscopoDeAtualizacao(comunidadeId);
    return this.prisma.comunidadePessoa.delete({
      where: {
        comunidadeId_pessoaId: {
          comunidadeId,
          pessoaId,
        },
      },
    });
  }

  /**
   * Garante que a comunidade existe e está dentro do escopo de `update` do usuário
   * (paróquias vinculadas em `usuarioParoquia`), distinguindo 404 (inexistente)
   * de 403 (existente fora do escopo).
   *
   * É pública para permitir reuso no fluxo de cadastro de pessoa vinculada a uma
   * comunidade (validação antes de qualquer escrita).
   */
  async validarComunidadeDentroDoEscopoDeAtualizacao(id: number) {
    const updateScope = accessibleBy(
      this.abilityService.ability,
      'update',
    ).comunidade;

    const comunidadeNoEscopo = await this.prisma.comunidade.findFirst({
      where: { AND: [{ id }, updateScope] },
    });

    if (!comunidadeNoEscopo) {
      await this.prisma.comunidade.findUniqueOrThrow({ where: { id } });
      throw new ForbiddenException(
        'Você não tem permissão para atualizar comunidade fora das suas paróquias.',
      );
    }

    return comunidadeNoEscopo;
  }

  /**
   * Projeta a condição de escopo de `comunidade` (relação to-one `comunidade.paroquia`)
   * para o modelo `paroquia`, para validar a paróquia alvo no cadastro.
   * `@casl/prisma` agrupa a regra condicional em um array `OR`; perfis sem condição
   * (ex.: ADMIN) resultam em `{}`.
   */

  private condicaoEscopoDeParoquia(
    scopeComunidade: Prisma.comunidadeWhereInput,
  ): Prisma.paroquiaWhereInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const condicao: any = Array.isArray(scopeComunidade.OR)
      ? scopeComunidade.OR[0]
      : scopeComunidade;


    const vinculos = condicao?.paroquia?.is
      ?.usuarioParoquias as Prisma.UsuarioParoquiaListRelationFilter;

    return vinculos ? { usuarioParoquias: vinculos } : {};
  }
}
