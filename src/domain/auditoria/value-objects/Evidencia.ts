import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que recoge la cita textual extraída de la transcripción que
 * justifica una evaluación de protocolo o una alerta de cumplimiento.
 * Aporta trazabilidad a la auditoría. Inmutable y con igualdad por valor.
 */
export class Evidencia extends ValueObject<string> {
  static crear(cita: string): Evidencia {
    const normalizada = cita.trim();
    if (normalizada.length === 0) {
      throw new DomainError('La evidencia no puede estar vacía.');
    }
    return new Evidencia(normalizada);
  }
}
