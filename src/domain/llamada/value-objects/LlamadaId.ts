import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que identifica de forma única una Llamada.
 * Invariante: cadena no vacía. Inmutable y con igualdad por valor.
 * La generación de nuevos identificadores es responsabilidad de la infraestructura.
 */
export class LlamadaId extends ValueObject<string> {
  static crear(valor: string): LlamadaId {
    const normalizado = valor.trim();
    if (normalizado.length === 0) {
      throw new DomainError('El identificador de la llamada no puede estar vacío.');
    }
    return new LlamadaId(normalizado);
  }
}
