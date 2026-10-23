import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './login.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { packRules } from '@casl/ability/extra';
import { createHash, randomBytes } from 'crypto';
import { SendEmailService } from 'src/external/send-email/send-email.service.js';
import { UsersService } from 'src/users/users.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: SendEmailService,
    private readonly userService: UsersService,
    private readonly abilityService: CaslAbilityService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userService.findOneByEmail(loginDto.email);
    const unauthorizedMessage =
      'Credenciais inválidas. Verifique se o email e senha estão corretos e se o usuario esta ativo no sistema.';

    if (!user || !user.active) {
      throw new UnauthorizedException(unauthorizedMessage);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      String(user.password),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(unauthorizedMessage);
    }

    const ability = this.abilityService.createForUser(user);
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: packRules(ability.rules),
    });

    return { access_token: token, access_token_type: 'Bearer' };
  }

  async forgotPassword(email: string) {
    this.logger.log(`Iniciando processo de recuperação de senha para ${email}`);
    const user = await this.userService.findOneByEmail(email);

    if (!user) {
      return { message: 'Email de recuperação enviado se o usuário existir.' };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    // TODO: isso é uma pratica insegura, deve ser implementado um sistema de token mais robusto
    const tempPassword = Math.random().toString(36).slice(-8);

    await this.userService.update(user.id, {
      password: tempPassword,
      resetPasswordToken: tokenHash,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    });

    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

    this.mailService.sendRecoveryEmail(user.email, resetLink, tempPassword);
    return { message: 'Email de recuperação enviado se o usuário existir.' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    this.logger.log(`Usuário ${userId} alterando senha`);
    const user = await this.userService.findByIdWithPassword(userId);

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      String(user.password),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }

    await this.userService.update(userId, {
      password: newPassword,
    });

    this.logger.log(`Senha alterada com sucesso para usuário ${userId}`);
    return { message: 'Senha alterada com sucesso.' };
  }
}
