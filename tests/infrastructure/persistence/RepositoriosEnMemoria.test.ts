import { describe, it, expect } from 'vitest';
import { LlamadaRepositoryEnMemoria } from '@infrastructure/persistence/LlamadaRepositoryEnMemoria';
import { AuditoriaRepositoryEnMemoria } from '@infrastructure/persistence/AuditoriaRepositoryEnMemoria';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

const crearLlamada = (id = 'llamada-001') =>
  Llamada.crear({
    id: LlamadaId.crear(id),
    agenteId: 'agente-007',
    fechaInicio: new Date('2026-06-21T10:00:00.000Z'),
    transcripcion: Transcripcion.crear([Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días')]),
  });

const crearResultado = (auditoriaId: string, llamadaId: string) =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(auditoriaId),
    llamadaId: LlamadaId.crear(llamadaId),
    evaluaciones: [EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, Evidencia.crear('cita'))],
    alertas: [],
  });

describe('LlamadaRepositoryEnMemoria', () => {
  it('guarda una llamada y la recupera por su identificador', async () => {
    const repo = new LlamadaRepositoryEnMemoria();
    const llamada = crearLlamada();
    await repo.guardar(llamada);
    const recuperada = await repo.obtenerPorId(LlamadaId.crear('llamada-001'));
    expect(recuperada?.esIgualA(llamada)).toBe(true);
  });

  it('devuelve null cuando la llamada no existe', async () => {
    const repo = new LlamadaRepositoryEnMemoria();
    expect(await repo.obtenerPorId(LlamadaId.crear('inexistente'))).toBeNull();
  });

  it('lista las llamadas pendientes de auditar', async () => {
    const repo = new LlamadaRepositoryEnMemoria();
    await repo.guardar(crearLlamada('llamada-001'));
    await repo.guardar(crearLlamada('llamada-002'));
    expect(await repo.listarPendientesDeAuditar()).toHaveLength(2);
  });

  it('puede sembrarse con un conjunto inicial de llamadas', async () => {
    const repo = new LlamadaRepositoryEnMemoria([crearLlamada('llamada-001')]);
    expect(await repo.obtenerPorId(LlamadaId.crear('llamada-001'))).not.toBeNull();
  });
});

describe('AuditoriaRepositoryEnMemoria', () => {
  it('guarda un resultado y lo recupera por la llamada', async () => {
    const repo = new AuditoriaRepositoryEnMemoria();
    await repo.guardar(crearResultado('auditoria-001', 'llamada-001'));
    const recuperados = await repo.obtenerPorLlamada(LlamadaId.crear('llamada-001'));
    expect(recuperados).toHaveLength(1);
  });

  it('devuelve una lista vacía si la llamada no tiene auditorías', async () => {
    const repo = new AuditoriaRepositoryEnMemoria();
    expect(await repo.obtenerPorLlamada(LlamadaId.crear('llamada-001'))).toHaveLength(0);
  });

  it('admite varias auditorías para la misma llamada', async () => {
    const repo = new AuditoriaRepositoryEnMemoria();
    await repo.guardar(crearResultado('auditoria-001', 'llamada-001'));
    await repo.guardar(crearResultado('auditoria-002', 'llamada-001'));
    expect(await repo.obtenerPorLlamada(LlamadaId.crear('llamada-001'))).toHaveLength(2);
  });
});
