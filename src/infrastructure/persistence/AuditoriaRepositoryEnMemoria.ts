import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Adaptador de persistencia en memoria para el Modo Demo.
 * Implementa el puerto AuditoriaRepository y admite varias auditorías por llamada.
 */
export class AuditoriaRepositoryEnMemoria implements AuditoriaRepository {
  private readonly resultados: ResultadoAuditoria[] = [];

  async guardar(resultado: ResultadoAuditoria): Promise<void> {
    this.resultados.push(resultado);
  }

  async obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]> {
    return this.resultados.filter((resultado) => resultado.llamadaId.esIgualA(id));
  }
}
