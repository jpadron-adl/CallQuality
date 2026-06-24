import { DatabaseSync } from 'node:sqlite';
import { crearEsquema } from '@infrastructure/persistence/sqlite/EsquemaSqlite';

/**
 * Abre (o crea) el fichero SQLite indicado y garantiza la existencia del esquema.
 * Devuelve una única conexión que el Composite Root comparte entre los repositorios,
 * de modo que ambos operan sobre el mismo almacén.
 */
export function abrirBaseDatosSqlite(dbPath: string): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  crearEsquema(db);
  return db;
}
