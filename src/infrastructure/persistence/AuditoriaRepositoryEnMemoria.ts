import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Adaptador de persistencia en memoria para el Modo Demo.
 * Implementa el puerto AuditoriaRepository y admite varias auditorías por llamada.
 * `guardar` tiene semántica de upsert por identidad (AuditoriaId), de modo que volver a
 * guardar una auditoría ya existente —p. ej. tras revisarla— la actualiza en lugar de
 * duplicarla, en coherencia con el adaptador SQLite.
 */
export class AuditoriaRepositoryEnMemoria implements AuditoriaRepository {
  private readonly resultados = new Map<string, ResultadoAuditoria>();

  async guardar(resultado: ResultadoAuditoria): Promise<void> {
    this.resultados.set(resultado.id.valor, resultado);
  }

  async obtenerPorId(id: AuditoriaId): Promise<ResultadoAuditoria | null> {
    return this.resultados.get(id.valor) ?? null;
  }

  async obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]> {
    return [...this.resultados.values()].filter((resultado) => resultado.llamadaId.esIgualA(id));
  }
}
