import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que representa la puntuación global de calidad de una auditoría.
 * Invariante: entero comprendido en el rango cerrado [0, 100].
 * Inmutable y con igualdad por valor.
 */
export class PuntuacionCalidad extends ValueObject<number> {
  private static readonly MINIMO = 0;
  private static readonly MAXIMO = 100;

  static crear(valor: number): PuntuacionCalidad {
    if (!Number.isInteger(valor)) {
      throw new DomainError(
        `La puntuación de calidad debe ser un entero; se recibió: ${valor}.`,
      );
    }
    if (valor < this.MINIMO || valor > this.MAXIMO) {
      throw new DomainError(
        `La puntuación de calidad debe estar entre ${this.MINIMO} y ${this.MAXIMO}; se recibió: ${valor}.`,
      );
    }
    return new PuntuacionCalidad(valor);
  }
}
