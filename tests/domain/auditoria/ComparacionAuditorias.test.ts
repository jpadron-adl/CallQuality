import { describe, it, expect } from 'vitest';
import { ComparacionAuditorias } from '@domain/auditoria/ComparacionAuditorias';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { DomainError } from '@domain/shared/DomainError';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

const cita = Evidencia.crear('cita');
const evaluacion = (tipo: TipoProtocolo, cumplido: boolean) =>
  EvaluacionProtocolo.crear(tipo, cumplido, cita);
const alerta = (tipo: TipoAlerta, severidad: SeveridadAlerta) =>
  AlertaCumplimiento.crear(tipo, severidad, cita);

interface Opciones {
  readonly evaluaciones?: EvaluacionProtocolo[];
  readonly alertas?: AlertaCumplimiento[];
}

const auditoria = (
  id: string,
  llamadaId: string,
  { evaluaciones = [evaluacion(TipoProtocolo.SALUDO_INICIAL, true)], alertas = [] }: Opciones = {},
): ResultadoAuditoria =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(id),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date('2026-06-20T10:00:00.000Z'),
    evaluaciones,
    alertas,
  });

describe('ComparacionAuditorias', () => {
  it('rechaza comparar auditorías de llamadas distintas', () => {
    const a = auditoria('a1', 'llamada-1');
    const b = auditoria('a2', 'llamada-2');
    expect(() => ComparacionAuditorias.comparar(a, b)).toThrow(DomainError);
  });

  it('expone la llamada y la identidad de ambas auditorías comparadas', () => {
    const a = auditoria('a1', 'llamada-1');
    const b = auditoria('a2', 'llamada-1');
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.llamadaId).toBe('llamada-1');
    expect(comparacion.auditoriaIdA).toBe('a1');
    expect(comparacion.auditoriaIdB).toBe('a2');
  });

  it('calcula la puntuación de cada auditoría y su diferencia (B menos A)', () => {
    const a = auditoria('a1', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
    });
    const b = auditoria('a2', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, true)],
    });
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.puntuacionA).toBe(50);
    expect(comparacion.puntuacionB).toBe(100);
    expect(comparacion.diferenciaPuntuacion).toBe(50);
  });

  it('lista los protocolos cuyo veredicto cambió y omite los que no cambiaron', () => {
    const a = auditoria('a1', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
    });
    const b = auditoria('a2', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, true)],
    });
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.protocolosCambiados).toEqual([
      { protocolo: 'DESPEDIDA', cumplidoA: false, cumplidoB: true },
    ]);
  });

  it('usa la puntuación efectiva: incorpora las correcciones humanas de cada auditoría', () => {
    const a = auditoria('a1', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
    });
    const b = auditoria('a2', 'llamada-1', {
      evaluaciones: [evaluacion(TipoProtocolo.SALUDO_INICIAL, true), evaluacion(TipoProtocolo.DESPEDIDA, false)],
    });
    b.revisar({
      revisor: 'supervisor-01',
      fechaRevision: new Date('2026-06-26T10:00:00.000Z'),
      correcciones: [evaluacion(TipoProtocolo.DESPEDIDA, true)],
    });
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.puntuacionA).toBe(50);
    expect(comparacion.puntuacionB).toBe(100);
    expect(comparacion.protocolosCambiados).toEqual([
      { protocolo: 'DESPEDIDA', cumplidoA: false, cumplidoB: true },
    ]);
  });

  it('clasifica las alertas en aparecidas (solo en B) y desaparecidas (solo en A)', () => {
    const a = auditoria('a1', 'llamada-1', {
      alertas: [alerta(TipoAlerta.QUEJA_GRAVE, SeveridadAlerta.MEDIA)],
    });
    const b = auditoria('a2', 'llamada-1', {
      alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA)],
    });
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.alertasAparecidas).toEqual([{ tipo: 'FRAUDE', severidad: 'ALTA' }]);
    expect(comparacion.alertasDesaparecidas).toEqual([{ tipo: 'QUEJA_GRAVE', severidad: 'MEDIA' }]);
  });

  it('no considera aparecida ni desaparecida una alerta del mismo tipo presente en ambas', () => {
    const a = auditoria('a1', 'llamada-1', {
      alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA)],
    });
    const b = auditoria('a2', 'llamada-1', {
      alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA)],
    });
    const comparacion = ComparacionAuditorias.comparar(a, b);
    expect(comparacion.alertasAparecidas).toEqual([]);
    expect(comparacion.alertasDesaparecidas).toEqual([]);
  });
});
