import "server-only";
import { Prisma } from "@prisma/client";

/**
 * Convierte modelos de Prisma a JSON seguro: `Decimal` pasa a string; fechas a ISO.
 */
export function prismaToJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_k, v) => {
      if (v instanceof Prisma.Decimal) {
        return v.toString();
      }
      return v;
    }),
  ) as T;
}
