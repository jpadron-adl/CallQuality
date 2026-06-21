import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Puerto de persistencia del agregado ResultadoAuditoria.
 * Permite varias auditorías por llamada (re-auditorías con distintos modelos o momentos).
 */
export interface AuditoriaRepository {
  guardar(resultado: ResultadoAuditoria): Promise<void>;
  obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]>;
}
