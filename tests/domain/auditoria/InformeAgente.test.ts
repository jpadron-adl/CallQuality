import { describe, it, expect } from 'vitest';
import { InformeAgente } from '@domain/auditoria/InformeAgente';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

const cita = Evidencia.crear('cita');
const evaluacion = (tipo: TipoProtocolo, cumplido: boolean) => EvaluacionProtocolo.crear(tipo, cumplido, cita);
const alerta = (tipo: TipoAlerta, severidad: SeveridadAlerta) => AlertaCumplimiento.crear(tipo, severidad, cita);

interface Opciones {
  readonly evaluaciones?: EvaluacionProtocolo[];
  readonly alertas?: AlertaCumplimiento[];
}

const auditoria = (
  id: string,
  llamadaId: string,
  fecha: string,
  { evaluaciones = [evaluacion(TipoProtocolo.SALUDO_INICIAL, true)], alertas = [] }: Opciones = {},
): ResultadoAuditoria =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(id),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date(fecha),
    evaluaciones,
    alertas,
  });

describe('InformeAgente', () => {
  it('produce un informe vacío cuando el agente no tiene auditorías', () => {
    const informe = InformeAgente.generar('agente-7', []);
    expect(informe.agenteId).toBe('agente-7');
    expect(informe.numeroLlamadasAuditadas).toBe(0);
    expect(informe.puntuacionMedia).toBe(0);
    expect(informe.protocolosMasIncumplidos).toEqual([]);
    expect(informe.totalAlertas).toBe(0);
  });

  it('promedia la puntuación vigente de las llamadas auditadas del agente', () => {
    const informe = InformeAgente.generar('agente-7', [
      auditoria('a1', 'llamada-1', '2026-06-20T10:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
      }),
      auditoria('a2', 'llamada-2', '2026-06-20T11:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, true)],
      }),
    ]);
    expect(informe.numeroLlamadasAuditadas).toBe(2);
    expect(informe.puntuacionMedia).toBe(75);
  });

  it('considera solo la auditoría más reciente de cada llamada (ignora re-auditorías previas)', () => {
    const informe = InformeAgente.generar('agente-7', [
      auditoria('vieja', 'llamada-1', '2026-06-20T10:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, false), evaluacion(TipoProtocolo.DESPEDIDA, false)],
      }),
      auditoria('nueva', 'llamada-1', '2026-06-21T10:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, true)],
      }),
    ]);
    expect(informe.numeroLlamadasAuditadas).toBe(1);
    expect(informe.puntuacionMedia).toBe(100);
  });

  it('clasifica los protocolos por número de incumplimientos, de mayor a menor', () => {
    const informe = InformeAgente.generar('agente-7', [
      auditoria('a1', 'llamada-1', '2026-06-20T10:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
      }),
      auditoria('a2', 'llamada-2', '2026-06-20T11:00:00.000Z', {
        evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, false), evaluacion(TipoProtocolo.DESPEDIDA, false)],
      }),
    ]);
    expect(informe.protocolosMasIncumplidos[0]).toEqual({
      protocolo: 'DESPEDIDA',
      incumplimientos: 2,
      evaluaciones: 2,
    });
    expect(informe.protocolosMasIncumplidos[1]).toEqual({
      protocolo: 'SALUDO_INICIAL',
      incumplimientos: 1,
      evaluaciones: 2,
    });
  });

  it('cuenta las alertas vigentes en total y por severidad', () => {
    const informe = InformeAgente.generar('agente-7', [
      auditoria('a1', 'llamada-1', '2026-06-20T10:00:00.000Z', {
        alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA), alerta(TipoAlerta.QUEJA_GRAVE, SeveridadAlerta.MEDIA)],
      }),
      auditoria('a2', 'llamada-2', '2026-06-20T11:00:00.000Z', {
        alertas: [alerta(TipoAlerta.AMENAZA, SeveridadAlerta.ALTA)],
      }),
    ]);
    expect(informe.totalAlertas).toBe(3);
    expect(informe.alertasPorSeveridad).toContainEqual({ severidad: 'ALTA', total: 2 });
    expect(informe.alertasPorSeveridad).toContainEqual({ severidad: 'MEDIA', total: 1 });
  });

  it('refleja la corrección humana al promediar (usa la puntuación efectiva)', () => {
    const revisada = auditoria('a1', 'llamada-1', '2026-06-20T10:00:00.000Z', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
    });
    revisada.revisar({
      revisor: 'supervisor-01',
      fechaRevision: new Date('2026-06-26T10:00:00.000Z'),
      correcciones: [evaluacion(TipoProtocolo.DESPEDIDA, true)],
    });
    const informe = InformeAgente.generar('agente-7', [revisada]);
    expect(informe.puntuacionMedia).toBe(100);
  });
});
