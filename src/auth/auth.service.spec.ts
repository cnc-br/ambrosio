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
    changeOwnPassword: ReturnType<typeof vi.fn>;
    setPasswordForRecovery: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersServiceMock = {
      findByIdWithPassword: vi.fn(),
      findOneByEmail: vi.fn(),
      update: vi.fn(),
      changeOwnPassword: vi.fn(),
      setPasswordForRecovery: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: { sign: vi.fn() } },
        {
          provide: SendEmailService,
          useValue: { sendRecoveryEmail: vi.fn() },
        },
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
      usersServiceMock.changeOwnPassword.mockResolvedValue(undefined);

      const result = await service.changePassword(
        'user-1',
        'senha-atual',
        'nova-senha',
      );

      expect(usersServiceMock.findByIdWithPassword).toHaveBeenCalledWith(
        'user-1',
      );
      expect(usersServiceMock.changeOwnPassword).toHaveBeenCalledWith(
        'user-1',
        'nova-senha',
      );
      expect(usersServiceMock.update).not.toHaveBeenCalled();
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

      expect(usersServiceMock.changeOwnPassword).not.toHaveBeenCalled();
      expect(usersServiceMock.update).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('define a senha temporária e os dados de recuperação pelo caminho dedicado', async () => {
      usersServiceMock.findOneByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'carmem@neocatecumenal.com.es',
        role: 'SECRETARIA_CNC',
      });
      usersServiceMock.setPasswordForRecovery.mockResolvedValue(undefined);

      const result = await service.forgotPassword(
        'carmem@neocatecumenal.com.es',
      );

      expect(usersServiceMock.setPasswordForRecovery).toHaveBeenCalledWith(
        'user-1',
        {
          password: expect.any(String),
          resetPasswordToken: expect.any(String),
          resetPasswordExpires: expect.any(Date),
        },
      );
      expect(usersServiceMock.update).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Email de recuperação enviado se o usuário existir.',
      });
    });

    it('mantém a resposta genérica quando o email não existe', async () => {
      usersServiceMock.findOneByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nao-existe@admin.com');

      expect(usersServiceMock.setPasswordForRecovery).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Email de recuperação enviado se o usuário existir.',
      });
    });
  });
});