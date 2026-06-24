import type { DatabaseSync } from 'node:sqlite';

/**
 * Crea (de forma idempotente) el esquema relacional del almacén SQLite.
 * Cada agregado se modela como una tabla; sus colecciones internas se guardan como
 * JSON en una columna, de modo que el agregado se persiste y recupera como una unidad.
 * Se habilita la integridad referencial (claves foráneas) entre auditorías y llamadas.
 */
export function crearEsquema(db: DatabaseSync): void {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS llamadas (
      id TEXT PRIMARY KEY,
      agenteId TEXT NOT NULL,
      fechaInicio TEXT NOT NULL,
      transcripcion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auditorias (
      id TEXT PRIMARY KEY,
      llamadaId TEXT NOT NULL REFERENCES llamadas(id),
      fechaAuditoria TEXT NOT NULL,
      evaluaciones TEXT NOT NULL,
      alertas TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auditorias_llamada ON auditorias(llamadaId);
  `);
}
