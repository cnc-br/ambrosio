import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PessoaContato } from 'neocatecumenal';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';
import { CreatePessoaContatoDto } from 'src/pessoa/dto/create-pessoa-contato.dto.js';
import { UpdatePessoaContatoDto } from 'src/pessoa/dto/update-pessoa-contato.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { CreateContatoMapper } from './mapper/create-contato.mapper.js';
import {
  ContatoResponseMapper,
  ExternalContatoResponse,
} from './mapper/contato-response.mapper.js';

@Injectable()
export class SaoPedroContatoService extends BaseService {
  constructor(
    private readonly httpService: HttpService,
    private readonly authService: SaoPedroAuthService,
    protected readonly abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async createExternalContato(
    pessoaUuid: string,
    createPessoaContatoDto: CreatePessoaContatoDto,
  ): Promise<PessoaContato> {
    const payload = CreateContatoMapper.toExternal(createPessoaContatoDto);
    this.logger.log(`Criando contato externo para pessoa UUID: ${pessoaUuid}`);

    return this.authService.executeAuthenticatedRequest(async (token: string) => {
      const response = await firstValueFrom(
        this.httpService.post<ExternalContatoResponse>(
          `${process.env.SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `Contato externo criado com sucesso - pessoa UUID: ${pessoaUuid}`,
      );

      return ContatoResponseMapper.toDomain(response.data);
    }, `criação de contato externo (pessoa UUID: ${pessoaUuid})`);
  }

  async updateExternalContato(
    contatoId: string,
    updatePessoaContatoDto: UpdatePessoaContatoDto,
  ): Promise<PessoaContato> {
    const contatoIdSeguro = this.validarContatoId(contatoId);
    const payload = CreateContatoMapper.toExternal(updatePessoaContatoDto);
    this.logger.log(`Atualizando contato externo ${contatoIdSeguro}`);

    return this.authService.executeAuthenticatedRequest(async (token: string) => {
      const response = await firstValueFrom(
        this.httpService.patch<ExternalContatoResponse>(
          `${process.env.SAO_PEDRO_API_URL}/api/contatos/${contatoIdSeguro}/`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      this.logger.log(
        `Contato externo ${contatoIdSeguro} atualizado com sucesso`,
      );

      return ContatoResponseMapper.toDomain(response.data);
    }, `atualização de contato externo (contato ID: ${contatoIdSeguro})`);
  }

  /**
   * O id de contato da São Pedro é sempre um inteiro positivo (ex.: `/api/contatos/9/`).
   * Validar o formato exato antes de montar a URL evita que valores com
   * segmentos de path traversal (`../`, `9/../x`, `%2F`, etc.) normalizem para
   * outro endpoint e façam o PATCH autenticado vazar o token para uma rota indevida.
   */
  private validarContatoId(contatoId: string): string {
    const parsed = Number(contatoId);
    const isInteiroPositivoCanonico =
      /^[1-9]\d*$/.test(contatoId) &&
      Number.isSafeInteger(parsed) &&
      String(parsed) === contatoId;

    if (!isInteiroPositivoCanonico) {
      throw new BadRequestException(
        'contatoId inválido: deve ser um inteiro positivo.',
      );
    }

    return encodeURIComponent(contatoId);
  }

  async findExternalContatos(pessoaUuid: string): Promise<PessoaContato[]> {
    this.logger.log(`Buscando contatos externos da pessoa UUID: ${pessoaUuid}`);

    return this.authService.executeAuthenticatedRequest(async (token: string) => {
      const response = await firstValueFrom(
        this.httpService.get(
          `${process.env.SAO_PEDRO_API_URL}/api/pessoas/${pessoaUuid}/contatos/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );

      const contatos = response.data?.data ?? response.data ?? [];
      this.logger.log(
        `${contatos.length} contatos externos encontrados para pessoa UUID: ${pessoaUuid}`,
      );

      return ContatoResponseMapper.toDomainList(contatos);
    }, `busca de contatos externos (pessoa UUID: ${pessoaUuid})`);
  }
}