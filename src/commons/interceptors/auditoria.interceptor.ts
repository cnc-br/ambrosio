import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Campos de auditoria que nunca devem ser expostos nas respostas da API.
 * Eles existem apenas para rastrear a autoria no banco.
 */
export const CAMPOS_AUDITORIA = ['cadastradoPorId', 'atualizadoPorId'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date) return false;
  if (Buffer.isBuffer(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Remove recursivamente os campos de auditoria de um payload, sem alterar
 * arrays, datas, buffers e instâncias de classes (ex.: `Prisma.Decimal`).
 */
export function removerCamposAuditoria(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removerCamposAuditoria);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(value)) {
    if ((CAMPOS_AUDITORIA as readonly string[]).includes(chave)) continue;
    result[chave] = removerCamposAuditoria(valor);
  }
  return result;
}

/**
 * Interceptor global que garante que `cadastradoPorId` e `atualizadoPorId`
 * não vazem em nenhuma resposta da API, mantendo os contratos existentes.
 * Deve ser registrado antes do `PaginationInterceptor` para enxergar o
 * envelope final já montado.
 */
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => removerCamposAuditoria(data)));
  }
}
