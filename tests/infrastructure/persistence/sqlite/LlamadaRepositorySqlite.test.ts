import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { LlamadaRepositorySqlite } from '@infrastructure/persistence/sqlite/LlamadaRepositorySqlite';
import { crearEsquema } from '@infrastructure/persistence/sqlite/EsquemaSqlite';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

const llamada = (id: string, agenteId = 'AGENTE_007'): Llamada =>
  Llamada.crear({
    id: LlamadaId.crear(id),
    agenteId,
    fechaInicio: new Date('2026-06-24T10:30:00.000Z'),
    transcripcion: Transcripcion.crear([
      Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días'),
      Intervencion.crear(IntervinienteRol.CLIENTE, 'Hola'),
    ]),
  });

describe('LlamadaRepositorySqlite', () => {
  let db: DatabaseSync;
  let repo: LlamadaRepositorySqlite;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    crearEsquema(db);
    repo = new LlamadaRepositorySqlite(db);
  });

  it('guarda una llamada y la recupera por su identificador', async () => {
    await repo.guardar(llamada('llamada-1'));

    const recuperada = await repo.obtenerPorId(LlamadaId.crear('llamada-1'));

    expect(recuperada).not.toBeNull();
    expect(recuperada?.esIgualA(llamada('llamada-1'))).toBe(true);
    expect(recuperada?.transcripcion.intervenciones).toHaveLength(2);
  });

  it('devuelve null cuando la llamada no existe', async () => {
    const recuperada = await repo.obtenerPorId(LlamadaId.crear('inexistente'));

    expect(recuperada).toBeNull();
  });

  it('lista todas las llamadas pendientes de auditar', async () => {
    await repo.guardar(llamada('llamada-1'));
    await repo.guardar(llamada('llamada-2'));

    const pendientes = await repo.listarPendientesDeAuditar();

    expect(pendientes).toHaveLength(2);
    expect(pendientes.map((l) => l.id.valor).sort()).toEqual(['llamada-1', 'llamada-2']);
  });

  it('actualiza (upsert) la llamada al guardar dos veces el mismo identificador', async () => {
    await repo.guardar(llamada('llamada-1', 'AGENTE_007'));
    await repo.guardar(llamada('llamada-1', 'AGENTE_999'));

    const pendientes = await repo.listarPendientesDeAuditar();
    const recuperada = await repo.obtenerPorId(LlamadaId.crear('llamada-1'));

    expect(pendientes).toHaveLength(1);
    expect(recuperada?.agenteId).toBe('AGENTE_999');
  });

  it('persiste los datos en el fichero SQLite entre instancias del repositorio', async () => {
    await repo.guardar(llamada('llamada-1'));

    const otroRepo = new LlamadaRepositorySqlite(db);
    const recuperada = await otroRepo.obtenerPorId(LlamadaId.crear('llamada-1'));

    expect(recuperada).not.toBeNull();
  });
});
