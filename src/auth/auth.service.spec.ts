import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { UsersService } from 'src/users/users.service.js';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { JwtService } from '@nestjs/jwt';
import { SendEmailService } from 'src/external/send-email/send-email.service.js';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: {
    findByIdWithPassword: ReturnType<typeof vi.fn>;
    findOneByEmail: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersServiceMock = {
      findByIdWithPassword: vi.fn(),
      findOneByEmail: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: vi.fn() } },
        { provide: SendEmailService, useValue: {} },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: CaslAbilityService, useValue: {} },
      ],
    }).compile();

    service = await module.resolve(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('changePassword', () => {
    it('troca a senha quando a senha atual está correta', async () => {
      usersServiceMock.findByIdWithPassword.mockResolvedValue({
        id: 'user-1',
        email: 'carmem@neocatecumenal.com.es',
        password: 'hash-existente',
        active: true,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      usersServiceMock.update.mockResolvedValue({ id: 'user-1' });

      const result = await service.changePassword(
        'user-1',
        'senha-atual',
        'nova-senha',
      );

      expect(usersServiceMock.findByIdWithPassword).toHaveBeenCalledWith(
        'user-1',
      );
      expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
        password: 'nova-senha',
      });
      expect(result).toEqual({ message: 'Senha alterada com sucesso.' });
    });

    it('responde 401 quando a senha atual está incorreta', async () => {
      usersServiceMock.findByIdWithPassword.mockResolvedValue({
        id: 'user-1',
        password: 'hash-existente',
        active: true,
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', 'senha-errada', 'nova-senha'),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersServiceMock.update).not.toHaveBeenCalled();
    });
  });
});