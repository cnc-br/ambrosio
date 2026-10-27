import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreatePessoaDto } from './dto/create-pessoa.dto.js';
import { UpdatePessoaDto } from './dto/update-pessoa.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import { SEXO_ENUM } from 'src/commons/enums/enums.js';
import { LIMIT_DEFAULT, PAGE_DEFAULT } from 'src/commons/constants/constants.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { accessibleBy } from '@casl/prisma';
import { Pessoa, PessoaConjugue, PessoaContato } from 'neocatecumenal';
import { pessoa } from 'src/prisma/generated-client.js';
import { SituacaoReligiosaService } from 'src/configuracoes/situacao-religiosa/situacao-religiosa.service.js';
import { SaoPedroPessoaService } from 'src/external/sao-pedro/sao-pedro-pessoa.service.js';
import { SaoPedroContatoService } from 'src/external/sao-pedro/sao-pedro-contato.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { serializePessoaResponse } from './pessoa.serializer.js';
import { ENDERECO_INCLUDE, PESSOA_CARISMA_INCLUDE } from 'src/prisma/includes.js';
import { PAROQUIA_SELECT } from 'src/prisma/selects/paroquia.select.js';

@Injectable()
export class PessoaService extends BaseService {
  constructor(
    private prisma: PrismaService,
    private situacaoReligiosaService: SituacaoReligiosaService,
    private readonly saoPedroPessoaService: SaoPedroPessoaService,
    private readonly saoPedroContatoService: SaoPedroContatoService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(createPessoaDto: CreatePessoaDto) {
    this.validateCreateAbility('pessoa');

    const situacaoReligiosa = await this.situacaoReligiosaService.findOne(
      createPessoaDto.situacaoReligiosa.id,
    );
    await this.analisarCPF(createPessoaDto.cpf);

    try {
      const external =
        await this.saoPedroPessoaService.createExternalPessoa(createPessoaDto);

      const pessoa = await this.prisma.pessoa.create({
        data: {
          externalId: external.externalId,
          situacaoReligiosaId: situacaoReligiosa.id,
        },
      });
      this.logger.log(
        `Pessoa ${external.nome} UUID: ${external.externalId} criada com ID ${pessoa.id}`,
      );
      return serializePessoaResponse(pessoa, external);
    } catch (error) {
      this.logger.error('Error posting external pessoa', error);
    }
  }

  async findAll(page: number, limit: number) {
    this.validateReadAbility('pessoa');
    const { ability } = this.abilityService;
    const where = accessibleBy(ability, 'read').pessoa;

    if (!page) page = PAGE_DEFAULT;
    if (!limit) limit = LIMIT_DEFAULT;

    const skip = (page - 1) * limit;

    const externalPessoas = await this.saoPedroPessoaService.findAllPessoas();
    this.logger.log(
      `Total de pessoas externas encontradas: ${externalPessoas.length}`,
    );

    const results = await this.prisma.pessoa.findMany({
      skip,
      take: limit,
      where,
      include: {
        situacaoReligiosa: true,
        pessoaCarismas: PESSOA_CARISMA_INCLUDE,
        enderecos: {
          include: {
            endereco: ENDERECO_INCLUDE,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Monta um dicionário com externalId como chave
    const externalMap = new Map(
      externalPessoas.map((ep) => [ep.externalId, ep]),
    );

    // Busca os contatos externos das pessoas da página (paralelo); falha
    // isolada não derruba a listagem — a pessoa retorna com contatos vazio
    const contatosMap = new Map<string, PessoaContato[]>();
    await Promise.all(
      results
        .filter((pessoa) => externalMap.has(pessoa.externalId))
        .map(async (pessoa) => {
          contatosMap.set(
            pessoa.externalId,
            await this.fetchExternalContatos(pessoa.externalId),
          );
        }),
    );

    return results
      .map((pessoa) => {
        const externalPessoa = externalMap.get(pessoa.externalId);

        if (externalPessoa) {
          return serializePessoaResponse(
            pessoa,
            externalPessoa,
            undefined,
            contatosMap.get(pessoa.externalId),
          );
        } else {
          this.logger.warn(
            `Pessoa com ID ${pessoa.id} não encontrada na API externa (externalId: ${pessoa.externalId})`,
          );
          return null;
        }
      })
      .filter(Boolean); // Remove os nulls do array
  }

  async findOneByCpf(cpf: string): Promise<Pessoa> {
    const externalPessoa =
      await this.saoPedroPessoaService.getExternalPessoaByCpf(cpf);

    if (!externalPessoa) {
      return null;
    }

    const pessoa = await this.prisma.pessoa.findUnique({
      where: { externalId: externalPessoa.externalId },
    });
    if (!pessoa) {
      return null;
    }

    const contatos = await this.fetchExternalContatos(pessoa.externalId);
    return serializePessoaResponse(pessoa, externalPessoa, undefined, contatos);
  }

  async findOne(id: number): Promise<Pessoa> {
    return this.findBy({ id });
  }

  async findByExternalId(externalId: string): Promise<Pessoa> {
    return this.findBy({ externalId });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async findBy(where: any): Promise<Pessoa> {
    const pessoa: pessoa = await this.prisma.pessoa.findUniqueOrThrow({
      where,
      include: {
        situacaoReligiosa: true,
        pessoaCarismas: PESSOA_CARISMA_INCLUDE,
        comunidadePessoas: {
          include: {
            comunidade: {
              include: {
                paroquia: {
                  select: PAROQUIA_SELECT,
                },
              },
            },
          },
        },
        enderecos: {
          include: {
            endereco: ENDERECO_INCLUDE,
          },
        },
      },
    });

    const externalPessoa =
      await this.saoPedroPessoaService.findExternalPessoaByUuid(
        pessoa.externalId,
      );
    const conjugue = await this.getConjugue(
      pessoa.id,
      externalPessoa.sexo === 'M' ? SEXO_ENUM.MASCULINO : SEXO_ENUM.FEMININO,
    );
    const contatos = await this.fetchExternalContatos(pessoa.externalId);
    return serializePessoaResponse(pessoa, externalPessoa, conjugue, contatos);
  }

  async update(id: number, updatePessoaDto: UpdatePessoaDto): Promise<Pessoa> {
    const pessoa = await this.findOne(id);

    // TODO: implementar regra para alteração de estado civil e sexo caso a pessoa esteja casada, para evitar inconsistências no cadastro do casal

    if (updatePessoaDto.situacaoReligiosa) {
      const situacaoReligiosa = await this.situacaoReligiosaService.findOne(
        updatePessoaDto.situacaoReligiosa.id,
      );
      this.logger.log(
        `Atualizando situação religiosa da pessoa ID ${id} para ${situacaoReligiosa.descricao}`,
      );
      await this.prisma.pessoa.update({
        where: { id },
        data: {
          situacaoReligiosaId: situacaoReligiosa.id,
        },
      });
    }

    await this.saoPedroPessoaService.updateExternalPessoa(
      pessoa.externalId,
      updatePessoaDto,
    );
    return pessoa;
  }

  private async fetchExternalContatos(
    pessoaUuid: string,
  ): Promise<PessoaContato[]> {
    try {
      return await this.saoPedroContatoService.findExternalContatos(pessoaUuid);
    } catch {
      this.logger.warn(
        `Não foi possível buscar os contatos da pessoa externalId: ${pessoaUuid}`,
      );
      return [];
    }
  }

  private async getConjugue(
    pessoaId: number,
    sexoPessoa: SEXO_ENUM,
  ): Promise<PessoaConjugue> {
    const where =
      sexoPessoa === SEXO_ENUM.MASCULINO
        ? { pessoaMaridoId: pessoaId }
        : { pessoaMulherId: pessoaId };

    const casal = await this.prisma.pessoaCasal.findFirst({ where });

    if (!casal) {
      this.logger.warn(
        `Pessoa com ID ${pessoaId} está com estado civil casado, mas não possui conjugue cadastrado.`,
      );
      return null;
    }

    const conjugue = await this.prisma.pessoa.findUniqueOrThrow({
      select: {
        id: true,
        externalId: true,
      },
      where: {
        id:
          sexoPessoa === SEXO_ENUM.MASCULINO
            ? casal.pessoaMulherId
            : casal.pessoaMaridoId,
      },
    });
    const externalConjugue =
      await this.saoPedroPessoaService.findExternalPessoaByUuid(
        conjugue.externalId,
      );
    return {
      id: conjugue.id,
      nome: externalConjugue.nome,
      externalId: externalConjugue.externalId,
    };
  }

  async analisarCPF(cpf: string) {
    // TODO: colocar validacao de CPF aqui
    if (cpf === undefined || cpf === '') {
      this.logger.log('CPF não informado');
      return;
    }

    const pessoa = await this.findOneByCpf(cpf);
    if (pessoa) {
      this.logger.warn(
        `CPF ${cpf} já está cadastrado. Pertence a: ${pessoa.nome} (ID: ${pessoa.id})`,
      );
      throw new ConflictException(
        `O CPF ja registrado para ${pessoa.nome} de id: ${pessoa.id}`,
      );
    }
  }
}
