import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PrismaService } from 'src/prisma.service.js';
import { user } from 'src/prisma/generated-client.js';
import { OptionalAuthGuard } from './optional-auth.guard.js';

describe('OptionalAuthGuard', () => {
  const createContext = (request: Record<string, unknown>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const buildGuard = (deps: {
    decode?: ReturnType<typeof vi.fn>;
    verify?: ReturnType<typeof vi.fn>;
    findUnique?: ReturnType<typeof vi.fn>;
  }) =>
    new OptionalAuthGuard(
      { decode: deps.decode, verify: deps.verify } as unknown as JwtService,
      { user: { findUnique: deps.findUnique } } as unknown as PrismaService,
      { createForUser: vi.fn() } as unknown as CaslAbilityService,
    );

  it('should be defined', () => {
    expect(new OptionalAuthGuard(null, null, null)).toBeDefined();
  });

  it('libera a request sem token quando nao ha cabecalho Authorization', async () => {
    const guard = buildGuard({
      decode: vi.fn(),
      verify: vi.fn(),
      findUnique: vi.fn(),
    });

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).resolves.toBe(true);
  });

  it('propaga 401 quando o token e invalido', async () => {
    const guard = buildGuard({
      decode: vi.fn().mockReturnValue({}),
      verify: vi.fn(),
      findUnique: vi.fn(),
    });

    await expect(
      guard.canActivate(
        createContext({ headers: { authorization: 'Bearer invalido' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('popula request.user e libera quando o token e valido', async () => {
    const currentUser = {
      id: '1',
      email: 'admin@admin.com',
      role: 'ADMIN',
    } as unknown as user;
    const guard = buildGuard({
      decode: vi.fn().mockReturnValue({ exp: dayjs().add(1, 'hour').unix() }),
      verify: vi.fn().mockReturnValue({ sub: '1' }),
      findUnique: vi.fn().mockResolvedValue(currentUser),
    });
    const request: { headers: Record<string, string>; user?: user } = {
      headers: { authorization: 'Bearer valido' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toBe(currentUser);
  });
});
