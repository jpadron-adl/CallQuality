import { ApplicationError } from '@application/shared/ApplicationError';
import type { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';

/**
 * Se lanza cuando se solicita revisar (u operar sobre) una auditoría que no existe
 * en el repositorio.
 */
export class AuditoriaNoEncontradaError extends ApplicationError {
  constructor(id: AuditoriaId) {
    super(`No se ha encontrado la auditoría con identificador "${id.valor}".`);
  }
}
