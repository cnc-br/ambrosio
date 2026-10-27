import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PessoaContato } from 'neocatecumenal';
import { SaoPedroAuthService } from './sao-pedro-auth.service.js';
import { CreatePessoaContatoDto } from 'src/pessoa/dto/create-pessoa-contato.dto.js';
import { BaseService } from 'src/commons/base.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { CreateContatoMapper } from './mapper/create-contato.mapper.js';

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
        this.httpService.post<PessoaContato>(
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

      return response.data;
    }, `criação de contato externo (pessoa UUID: ${pessoaUuid})`);
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

      return contatos;
    }, `busca de contatos externos (pessoa UUID: ${pessoaUuid})`);
  }
}