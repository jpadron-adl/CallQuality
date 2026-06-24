import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { AuditoriaRepositorySqlite } from '@infrastructure/persistence/sqlite/AuditoriaRepositorySqlite';
import { LlamadaRepositorySqlite } from '@infrastructure/persistence/sqlite/LlamadaRepositorySqlite';
import { crearEsquema } from '@infrastructure/persistence/sqlite/EsquemaSqlite';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

const auditoria = (id: string, llamadaId: string, fecha: string): ResultadoAuditoria =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(id),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date(fecha),
    evaluaciones: [
      EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, Evidencia.crear('Hola')),
    ],
    alertas: [],
  });

describe('AuditoriaRepositorySqlite', () => {
  let db: DatabaseSync;
  let repo: AuditoriaRepositorySqlite;

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    crearEsquema(db);
    // La integridad referencial exige que la llamada exista antes de auditarla.
    const llamadas = new LlamadaRepositorySqlite(db);
    await llamadas.guardar(
      Llamada.crear({
        id: LlamadaId.crear('llamada-1'),
        agenteId: 'AGENTE_007',
        fechaInicio: new Date('2026-06-24T10:00:00.000Z'),
        transcripcion: Transcripcion.crear([
          Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días'),
        ]),
      }),
    );
    repo = new AuditoriaRepositorySqlite(db);
  });

  it('guarda una auditoría y la recupera por la llamada', async () => {
    await repo.guardar(auditoria('auditoria-1', 'llamada-1', '2026-06-24T11:00:00.000Z'));

    const recuperadas = await repo.obtenerPorLlamada(LlamadaId.crear('llamada-1'));

    expect(recuperadas).toHaveLength(1);
    expect(recuperadas[0]?.id.valor).toBe('auditoria-1');
  });

  it('admite varias auditorías por llamada (re-auditorías) y las recupera todas', async () => {
    await repo.guardar(auditoria('auditoria-1', 'llamada-1', '2026-06-24T11:00:00.000Z'));
    await repo.guardar(auditoria('auditoria-2', 'llamada-1', '2026-06-24T12:00:00.000Z'));

    const recuperadas = await repo.obtenerPorLlamada(LlamadaId.crear('llamada-1'));

    expect(recuperadas).toHaveLength(2);
    expect(recuperadas.map((r) => r.id.valor).sort()).toEqual(['auditoria-1', 'auditoria-2']);
  });

  it('devuelve una lista vacía cuando la llamada no tiene auditorías', async () => {
    const recuperadas = await repo.obtenerPorLlamada(LlamadaId.crear('llamada-1'));

    expect(recuperadas).toEqual([]);
  });

  it('aísla las auditorías por llamada', async () => {
    const llamadas = new LlamadaRepositorySqlite(db);
    await llamadas.guardar(
      Llamada.crear({
        id: LlamadaId.crear('llamada-2'),
        agenteId: 'AGENTE_999',
        fechaInicio: new Date('2026-06-24T10:00:00.000Z'),
        transcripcion: Transcripcion.crear([
          Intervencion.crear(IntervinienteRol.AGENTE, 'Hola'),
        ]),
      }),
    );
    await repo.guardar(auditoria('auditoria-1', 'llamada-1', '2026-06-24T11:00:00.000Z'));
    await repo.guardar(auditoria('auditoria-2', 'llamada-2', '2026-06-24T11:00:00.000Z'));

    const deLlamada1 = await repo.obtenerPorLlamada(LlamadaId.crear('llamada-1'));

    expect(deLlamada1).toHaveLength(1);
    expect(deLlamada1[0]?.id.valor).toBe('auditoria-1');
  });
});
