import type { DatabaseSync } from 'node:sqlite';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import {
  serializarAuditoria,
  deserializarAuditoria,
  type FilaAuditoria,
} from '@infrastructure/persistence/sqlite/MapeadorAuditoria';

/**
 * Adaptador de persistencia del agregado ResultadoAuditoria sobre SQLite (node:sqlite).
 * Implementa el puerto AuditoriaRepository y admite varias auditorías por llamada
 * (re-auditorías). La conexión se inyecta y se comparte con el resto de repositorios.
 */
export class AuditoriaRepositorySqlite implements AuditoriaRepository {
  constructor(private readonly db: DatabaseSync) {}

  async guardar(resultado: ResultadoAuditoria): Promise<void> {
    const fila = serializarAuditoria(resultado);
    this.db
      .prepare(
        `INSERT INTO auditorias (id, llamadaId, fechaAuditoria, evaluaciones, alertas, revision)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           llamadaId = excluded.llamadaId,
           fechaAuditoria = excluded.fechaAuditoria,
           evaluaciones = excluded.evaluaciones,
           alertas = excluded.alertas,
           revision = excluded.revision`,
      )
      .run(fila.id, fila.llamadaId, fila.fechaAuditoria, fila.evaluaciones, fila.alertas, fila.revision);
  }

  async obtenerPorId(id: AuditoriaId): Promise<ResultadoAuditoria | null> {
    const fila = this.db
      .prepare(
        `SELECT id, llamadaId, fechaAuditoria, evaluaciones, alertas, revision
         FROM auditorias WHERE id = ?`,
      )
      .get(id.valor) as unknown as FilaAuditoria | undefined;
    return fila === undefined ? null : deserializarAuditoria(fila);
  }

  async obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]> {
    const filas = this.db
      .prepare(
        `SELECT id, llamadaId, fechaAuditoria, evaluaciones, alertas, revision
         FROM auditorias WHERE llamadaId = ? ORDER BY fechaAuditoria ASC`,
      )
      .all(id.valor) as unknown as FilaAuditoria[];
    return filas.map((fila) => deserializarAuditoria(fila));
  }
}
