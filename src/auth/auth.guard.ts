import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { AuthUserResolver } from './auth-user.resolver.js';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authUserResolver: AuthUserResolver;

  constructor(
    jwtService: JwtService,
    prismaService: PrismaService,
    abilityService: CaslAbilityService,
  ) {
    this.authUserResolver = new AuthUserResolver(
      jwtService,
      prismaService,
      abilityService,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const user = await this.authUserResolver.resolve(request);
    if (!user) {
      throw new UnauthorizedException('Invalid or missing token');
    }

    return true;
  }
}
