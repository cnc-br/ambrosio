import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateAvisoDto } from './create-aviso.dto.js';
import { UpdateAvisoDto } from './update-aviso.dto.js';

const validateCreate = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(CreateAvisoDto, payload);
  const errors = await validate(dto);
  return { dto, errors };
};

const validateUpdate = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(UpdateAvisoDto, payload);
  const errors = await validate(dto);
  return { dto, errors };
};

describe('CreateAvisoDto', () => {
  it('aceita texto e dataFim (ISO-8601) válidos', async () => {
    const { dto, errors } = await validateCreate({
      texto: 'Novo horário de missas',
      dataFim: '2026-12-31T23:59:59.000Z',
    });

    expect(errors).toHaveLength(0);
    expect(dto.texto).toBe('Novo horário de missas');
    expect(dto.dataFim).toBe('2026-12-31T23:59:59.000Z');
  });

  it('rejeita texto ausente', async () => {
    const { errors } = await validateCreate({ dataFim: '2026-12-31T23:59:59.000Z' });

    expect(errors.map((error) => error.property)).toContain('texto');
  });

  it('rejeita texto vazio', async () => {
    const { errors } = await validateCreate({
      texto: '',
      dataFim: '2026-12-31T23:59:59.000Z',
    });

    expect(errors.map((error) => error.property)).toContain('texto');
  });

  it('rejeita dataFim ausente', async () => {
    const { errors } = await validateCreate({ texto: 'Aviso sem data' });

    expect(errors.map((error) => error.property)).toContain('dataFim');
  });

  it('rejeita dataFim fora do formato ISO-8601', async () => {
    const { errors } = await validateCreate({
      texto: 'Aviso com data inválida',
      dataFim: '31/12/2026',
    });

    expect(errors.map((error) => error.property)).toContain('dataFim');
  });
});

describe('UpdateAvisoDto', () => {
  it('aceita payload vazio (todos os campos opcionais)', async () => {
    const { errors } = await validateUpdate({});

    expect(errors).toHaveLength(0);
  });

  it('aceita atualização parcial somente do texto', async () => {
    const { dto, errors } = await validateUpdate({ texto: 'Novo texto' });

    expect(errors).toHaveLength(0);
    expect(dto.texto).toBe('Novo texto');
    expect(dto.dataFim).toBeUndefined();
  });

  it('aceita atualização parcial somente da dataFim', async () => {
    const { dto, errors } = await validateUpdate({
      dataFim: '2027-01-15T00:00:00.000Z',
    });

    expect(errors).toHaveLength(0);
    expect(dto.dataFim).toBe('2027-01-15T00:00:00.000Z');
    expect(dto.texto).toBeUndefined();
  });

  it('rejeita dataFim inválida quando informada', async () => {
    const { errors } = await validateUpdate({ dataFim: 'amanhã' });

    expect(errors.map((error) => error.property)).toContain('dataFim');
  });

  it('rejeita texto vazio quando informado', async () => {
    const { errors } = await validateUpdate({ texto: '' });

    expect(errors.map((error) => error.property)).toContain('texto');
  });

  it('rejeita texto null quando informado', async () => {
    const { errors } = await validateUpdate({ texto: null });

    expect(errors.map((error) => error.property)).toContain('texto');
  });

  it('rejeita dataFim null quando informada', async () => {
    const { errors } = await validateUpdate({ dataFim: null });

    expect(errors.map((error) => error.property)).toContain('dataFim');
  });
});
