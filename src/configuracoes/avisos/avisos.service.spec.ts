import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from 'src/prisma.service.js';
import { AvisosService } from './avisos.service.js';

describe('AvisosService', () => {
  let service: AvisosService;
  let create: ReturnType<typeof vi.fn>;
  let findMany: ReturnType<typeof vi.fn>;
  let findUniqueOrThrow: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    create = vi.fn();
    findMany = vi.fn();
    findUniqueOrThrow = vi.fn();
    update = vi.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvisosService,
        {
          provide: PrismaService,
          useValue: {
            aviso: { create, findMany, findUniqueOrThrow, update },
          },
        },
      ],
    }).compile();

    service = module.get<AvisosService>(AvisosService);
  });

  it('persiste texto e dataFim ao criar um aviso', async () => {
    const avisoCriado = {
      id: 1,
      texto: 'Novo horário de missas',
      dataFim: new Date('2026-12-31T23:59:59.000Z'),
      createdAt: new Date('2026-11-07T10:00:00.000Z'),
      updatedAt: new Date('2026-11-07T10:00:00.000Z'),
    };
    create.mockResolvedValue(avisoCriado);

    const resultado = await service.create({
      texto: 'Novo horário de missas',
      dataFim: '2026-12-31T23:59:59.000Z',
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        texto: 'Novo horário de missas',
        dataFim: '2026-12-31T23:59:59.000Z',
      },
    });
    expect(resultado).toEqual(avisoCriado);
  });

  it('lista os avisos ordenados por dataFim decrescente', async () => {
    const avisos = [
      { id: 2, texto: 'Aviso mais novo', dataFim: new Date('2027-01-01T00:00:00.000Z') },
      { id: 1, texto: 'Aviso mais antigo', dataFim: new Date('2026-12-01T00:00:00.000Z') },
    ];
    findMany.mockResolvedValue(avisos);

    const resultado = await service.findAll();

    expect(findMany).toHaveBeenCalledWith({ orderBy: { dataFim: 'desc' } });
    expect(resultado).toEqual(avisos);
  });

  it('busca um aviso por id com findUniqueOrThrow', async () => {
    const aviso = { id: 7, texto: 'Aviso único', dataFim: new Date('2026-12-31T00:00:00.000Z') };
    findUniqueOrThrow.mockResolvedValue(aviso);

    const resultado = await service.findOne(7);

    expect(findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(resultado).toEqual(aviso);
  });

  it('atualiza um aviso com os campos parciais informados', async () => {
    const avisoAtualizado = {
      id: 7,
      texto: 'Texto atualizado',
      dataFim: new Date('2027-06-30T00:00:00.000Z'),
      createdAt: new Date('2026-11-07T10:00:00.000Z'),
      updatedAt: new Date('2026-11-07T11:00:00.000Z'),
    };
    update.mockResolvedValue(avisoAtualizado);

    const resultado = await service.update(7, {
      texto: 'Texto atualizado',
      dataFim: '2027-06-30T00:00:00.000Z',
    });

    expect(update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        texto: 'Texto atualizado',
        dataFim: '2027-06-30T00:00:00.000Z',
      },
    });
    expect(resultado).toEqual(avisoAtualizado);
  });
});
