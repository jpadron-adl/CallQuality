import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que identifica de forma única un ResultadoAuditoria.
 * Invariante: cadena no vacía. Inmutable y con igualdad por valor.
 * La generación de nuevos identificadores es responsabilidad de la infraestructura.
 */
export class AuditoriaId extends ValueObject<string> {
  static crear(valor: string): AuditoriaId {
    const normalizado = valor.trim();
    if (normalizado.length === 0) {
      throw new DomainError('El identificador de la auditoría no puede estar vacío.');
    }
    return new AuditoriaId(normalizado);
  }
}
