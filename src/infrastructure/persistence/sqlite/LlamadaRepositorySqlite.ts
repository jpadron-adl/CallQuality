import type { DatabaseSync } from 'node:sqlite';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { Llamada } from '@domain/llamada/Llamada';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import {
  serializarLlamada,
  deserializarLlamada,
  type FilaLlamada,
} from '@infrastructure/persistence/sqlite/MapeadorLlamada';

/**
 * Adaptador de persistencia del agregado Llamada sobre SQLite (módulo nativo node:sqlite).
 * Implementa el puerto LlamadaRepository sin que el dominio conozca el motor subyacente.
 * La conexión se inyecta (el Composite Root la abre y la comparte con los demás repositorios).
 */
export class LlamadaRepositorySqlite implements LlamadaRepository {
  constructor(private readonly db: DatabaseSync) {}

  async obtenerPorId(id: LlamadaId): Promise<Llamada | null> {
    const fila = this.db
      .prepare('SELECT id, agenteId, fechaInicio, transcripcion FROM llamadas WHERE id = ?')
      .get(id.valor) as FilaLlamada | undefined;
    return fila === undefined ? null : deserializarLlamada(fila);
  }

  async guardar(llamada: Llamada): Promise<void> {
    const fila = serializarLlamada(llamada);
    this.db
      .prepare(
        `INSERT INTO llamadas (id, agenteId, fechaInicio, transcripcion)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           agenteId = excluded.agenteId,
           fechaInicio = excluded.fechaInicio,
           transcripcion = excluded.transcripcion`,
      )
      .run(fila.id, fila.agenteId, fila.fechaInicio, fila.transcripcion);
  }

  async listarPendientesDeAuditar(): Promise<Llamada[]> {
    const filas = this.db
      .prepare('SELECT id, agenteId, fechaInicio, transcripcion FROM llamadas')
      .all() as unknown as FilaLlamada[];
    return filas.map((fila) => deserializarLlamada(fila));
  }
}
