import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { ComparacionAuditorias } from '@domain/auditoria/ComparacionAuditorias';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { AuditoriaNoEncontradaError } from '@application/shared/AuditoriaNoEncontradaError';

/**
 * Caso de uso (consulta): contrasta dos auditorías de la misma llamada. Recupera ambos
 * agregados por su identificador y delega en el dominio el cálculo de la comparación (que
 * valida que pertenecen a la misma llamada). Es una operación de solo lectura: no modifica
 * el estado del sistema.
 */
export class CompararAuditorias {
  constructor(private readonly auditorias: AuditoriaRepository) {}

  async ejecutar(auditoriaIdA: string, auditoriaIdB: string): Promise<ComparacionAuditorias> {
    const idA = AuditoriaId.crear(auditoriaIdA);
    const idB = AuditoriaId.crear(auditoriaIdB);

    const a = await this.auditorias.obtenerPorId(idA);
    if (a === null) {
      throw new AuditoriaNoEncontradaError(idA);
    }
    const b = await this.auditorias.obtenerPorId(idB);
    if (b === null) {
      throw new AuditoriaNoEncontradaError(idB);
    }

    return ComparacionAuditorias.comparar(a, b);
  }
}
