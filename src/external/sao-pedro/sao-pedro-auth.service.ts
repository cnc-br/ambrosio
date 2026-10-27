import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface AuthResponse {
  access: string;
  refresh: string;
}

@Injectable()
export class SaoPedroAuthService {
  private readonly logger = new Logger(SaoPedroAuthService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiryTime: number | null = null;

  constructor(private readonly http: HttpService) {}

  private async login(): Promise<void> {
    this.logger.log('Fazendo login na API externa...');

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${process.env.SAO_PEDRO_API_URL}/api/token/`,
          {
            username: process.env.SAO_PEDRO_API_USER,
            password: process.env.SAO_PEDRO_API_PASS,
          },
        ),
      );

      this.accessToken = response.data.access;
      this.refreshToken = response.data.refresh;

      // Define expiração em 30 minutos (assumindo JWT padrão)
      this.tokenExpiryTime = Date.now() + 30 * 60 * 1000;

      this.logger.log('Login realizado com sucesso');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error('Erro ao fazer login:', error.message);
      throw new UnauthorizedException('Falha na autenticação com API externa');
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      this.logger.warn('Refresh token não disponível, fazendo login novamente');
      await this.login();
      return;
    }

    this.logger.log('Renovando access token...');

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(
          `${process.env.SAO_PEDRO_API_URL}/api/token/refresh/`,
          {
            refresh: this.refreshToken,
          },
        ),
      );

      this.accessToken = response.data.access;

      // Atualiza refresh token se fornecido
      if (response.data.refresh) {
        this.refreshToken = response.data.refresh;
      }

      // Atualiza tempo de expiração
      this.tokenExpiryTime = Date.now() + 30 * 60 * 1000; // 30 minutos

      this.logger.log('Token renovado com sucesso');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error('Erro ao renovar token:', error.message);
      // Se falhar no refresh, tenta login completo
      await this.login();
    }
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) return true;
    // Considera expirado 5 minutos antes do tempo real para evitar requests com token expirado
    return Date.now() >= this.tokenExpiryTime - 5 * 60 * 1000;
  }

  async getValidToken(): Promise<string> {
    // Se não tem token ou está expirado, renova
    if (!this.accessToken || this.isTokenExpired()) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        await this.login();
      }
    }

    return this.accessToken!;
  }

  async handleAuthError(): Promise<string> {
    this.logger.warn('Tratando erro de autenticação - renovando token...');
    await this.refreshAccessToken();
    return this.accessToken!;
  }

  // Método para limpar tokens (logout)
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
    this.logger.log('Tokens limpos');
  }

  /**
   * Método centralizado para fazer requisições autenticadas com retry automático
   */
  async executeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>,
    operation: string,
  ): Promise<T> {
    try {
      // Primeira tentativa com token válido
      const token = await this.getValidToken();
      return await requestFn(token);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Se erro 401, tenta renovar token e repetir
      if (error.response?.status === 401) {
        this.logger.warn(`Token inválido durante ${operation}. Renovando...`);

        try {
          const newToken = await this.handleAuthError();
          return await requestFn(newToken);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (retryError: any) {
          this.logger.error(
            `Falha em ${operation} após renovação de token:`,
            retryError.message,
          );
          throw new HttpException(
            `Erro ao executar ${operation}`,
            retryError.response?.status || 500,
          );
        }
      }

      // Para outros erros, propaga diretamente
      this.logger.error(`Erro em ${operation}:`, error.message);
      throw new HttpException(
        `Erro ao executar ${operation}`,
        error.response?.status || 500,
      );
    }
  }
}
