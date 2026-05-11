import { ValueTransformer } from 'typeorm';

/**
 * Convierte columnas `decimal` de Postgres (que TypeORM entrega como string)
 * a `number` al leer, y deja pasar el valor numérico al escribir.
 */
export const decimalNumberTransformer: ValueTransformer = {
  to: (value?: number | null): number | null | undefined => value,
  from: (value: string | null): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  },
};
