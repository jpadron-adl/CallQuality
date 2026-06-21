import { ApplicationError } from '@application/shared/ApplicationError';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Se lanza cuando se solicita auditar una llamada que no existe en el repositorio.
 */
export class LlamadaNoEncontradaError extends ApplicationError {
  constructor(id: LlamadaId) {
    super(`No se ha encontrado la llamada con identificador "${id.valor}".`);
  }
}
