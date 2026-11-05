import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { FindAllExecutionsQueryDto } from './find-all-executions-query.dto.js';

const validateDto = async (payload: Record<string, unknown>) => {
  const dto = plainToInstance(FindAllExecutionsQueryDto, payload);
  const errors = await validate(dto);
  return { dto, errors };
};

describe('FindAllExecutionsQueryDto', () => {
  it('aceita page e limit válidos e converte os valores para número', async () => {
    const { dto, errors } = await validateDto({ page: '2', limit: '10' });

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
  });

  it('aceita a ausência de page e limit', async () => {
    const { errors } = await validateDto({});

    expect(errors).toHaveLength(0);
  });

  it('rejeita page e limit menores que 1', async () => {
    const { errors } = await validateDto({ page: 0, limit: 0 });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'limit']),
    );
  });

  it('rejeita page e limit não numéricos', async () => {
    const { errors } = await validateDto({ page: 'abc', limit: 'dez' });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['page', 'limit']),
    );
  });
});
