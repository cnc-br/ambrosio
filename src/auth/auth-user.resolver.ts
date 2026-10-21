import { UnauthorizedException } from '@nestjs/common';
import dayjs from 'dayjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { user } from 'src/prisma/generated-client.js';

export class AuthUserResolver {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly abilityService: CaslAbilityService,
  ) {}

  async resolve(request: Request): Promise<user | null> {
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring('Bearer '.length).trim();
      if (!token) {
        throw new UnauthorizedException('Invalid token');
      }

      const decoded = this.jwtService.decode(token) as { exp?: number };
      if (!decoded?.exp || dayjs().unix() >= decoded.exp) {
        throw new UnauthorizedException('Invalid token');
      }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        algorithms: ['HS256'],
      });

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      request.user = user;
      this.abilityService.createForUser(user);

      return user;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
