import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { PrismaService } from 'src/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { CaslAbilityService } from 'src/casl/casl-ability/casl-ability.service.js';
import { PessoaService } from 'src/pessoa/pessoa.service.js';
import { BaseService } from 'src/commons/base.service.js';
import { UserRoleEnum, User } from 'neocatecumenal';
import { PAROQUIA_BASICA_SELECT } from 'src/prisma/selects/paroquia.select.js';
import { serializeUserResponse } from './user.serializer.js';

const SALT_OR_ROUNDS = 10;

@Injectable()
export class UsersService extends BaseService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly pessoaService: PessoaService,
    abilityService: CaslAbilityService,
  ) {
    super(abilityService);
  }

  async create(createUserDto: CreateUserDto) {
    this.validateCreateAbility('user');
    const pessoa = await this.pessoaService.findOneByCpf(createUserDto.cpf);
    if (!pessoa) {
      throw new NotFoundException(
        `Não é possível criar um usuário sem uma pessoa vinculada. CPF ${createUserDto.cpf} não encontrado na base de pessoas.`,
      );
    }
    this.logger.log(
      `Pessoa para esse usuario encontrada: ${JSON.stringify(pessoa)}`,
    );
    await this.validateUniquePessoaForUser(pessoa.id);

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      SALT_OR_ROUNDS,
    );

    return await this.prismaService.user.create({
      data: {
        pessoaId: pessoa.id,
        email: createUserDto.email,
        whatsapp: createUserDto.whatsapp,
        password: hashedPassword,
        role: UserRoleEnum.NAO_IDENTIFICADO,
      },
    });
  }

  findAll() {
    this.validateReadAbility('user');
    return this.prismaService.user.findMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id },
      include: {
        usuarioParoquias: {
          select: {
            paroquia: {
              select: PAROQUIA_BASICA_SELECT,
            },
          },
        },
      },
    });

    const pessoa = user.pessoaId
      ? await this.pessoaService.findOne(user.pessoaId)
      : undefined;

    return serializeUserResponse(user, pessoa);
  }

  findOneByEmail(email: string) {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  async changeOwnPassword(userId: string, newPassword: string) {
    this.validateAbility('changePassword', 'user');
    const hashedPassword = await bcrypt.hash(newPassword, SALT_OR_ROUNDS);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async setPasswordForRecovery(
    userId: string,
    data: {
      password: string;
      resetPasswordToken: string;
      resetPasswordExpires: Date;
    },
  ) {
    const hashedPassword = await bcrypt.hash(data.password, SALT_OR_ROUNDS);

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: data.resetPasswordToken,
        resetPasswordExpires: data.resetPasswordExpires,
      },
    });
  }

  findByIdWithPassword(id: string) {
    return this.prismaService.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        password: true,
        active: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.validateUpdateAbility('user');
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        SALT_OR_ROUNDS,
      );
    }
    return await this.prismaService.user.update({
      where: { id },
      data: {
        active: updateUserDto.active,
        resetPasswordToken: updateUserDto.resetPasswordToken,
        resetPasswordExpires: updateUserDto.resetPasswordExpires,
        password: updateUserDto.password,
        email: updateUserDto.email,
        whatsapp: updateUserDto.whatsapp,
        role: updateUserDto.role,
      },
    });
  }

  async adicionarParoquiasAoUsuario(userId: string, paroquiaIds: number[]) {
    this.validateUpdateAbility('user');
    return await this.prismaService.$transaction(async (tx) => {
      await tx.user.findUniqueOrThrow({ where: { id: userId } });
      await tx.usuarioParoquia.deleteMany({ where: { userId } });

      return await tx.usuarioParoquia.createMany({
        data: paroquiaIds.map((paroquiaId) => ({ userId, paroquiaId })),
      });
    });
  }

  async adicionarSetoresAoUsuario(userId: string, setorIds: number[]) {
    this.validateUpdateAbility('user');
    return await this.prismaService.$transaction(async (tx) => {
      await tx.user.findUniqueOrThrow({ where: { id: userId } });

      if (setorIds.length > 0) {
        const setores = await tx.setor.findMany({
          where: { id: { in: setorIds } },
          select: { id: true },
        });

        if (setores.length !== setorIds.length) {
          const encontrados = setores.map((setor) => setor.id);
          const inexistentes = setorIds.filter(
            (setorId) => !encontrados.includes(setorId),
          );
          throw new NotFoundException(
            `O registro de 'Setor' não foi encontrado: ${inexistentes.join(', ')}.`,
          );
        }
      }

      await tx.usuarioSetor.deleteMany({ where: { userId } });

      return await tx.usuarioSetor.createMany({
        data: setorIds.map((setorId) => ({ userId, setorId })),
      });
    });
  }

  async remove(id: string) {
    this.validateDeleteAbility('user');
    await this.prismaService.user.delete({
      where: { id },
    });
  }

  getRoles() {
    return Object.values(UserRoleEnum);
  }

  private async validateUniquePessoaForUser(pessoaId: number) {
    const cpfAlreadyExists = await this.prismaService.user.findFirst({
      where: { pessoaId },
    });

    if (cpfAlreadyExists) {
      throw new ConflictException(
        `Já tem um usuario com esse ID: ${pessoaId} - Email: ${cpfAlreadyExists.email}`,
      );
    }
  }
}
