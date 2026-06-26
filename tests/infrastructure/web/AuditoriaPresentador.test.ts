import { describe, it, expect } from 'vitest';
import {
  presentarLlamada,
  presentarResultadoAuditoria,
  presentarInformeAgente,
} from '@infrastructure/web/AuditoriaPresentador';
import { InformeAgente } from '@domain/auditoria/InformeAgente';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

const llamadaEjemplo = Llamada.crear({
  id: LlamadaId.crear('llamada-001'),
  agenteId: 'agente-7',
  fechaInicio: new Date('2026-01-15T10:30:00.000Z'),
  transcripcion: Transcripcion.crear([
    Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días'),
    Intervencion.crear(IntervinienteRol.CLIENTE, 'Hola'),
  ]),
});

const resultadoEjemplo = ResultadoAuditoria.crear({
  id: AuditoriaId.crear('auditoria-001'),
  llamadaId: LlamadaId.crear('llamada-001'),
  fechaAuditoria: new Date('2026-02-20T08:45:00.000Z'),
  evaluaciones: [
    EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, Evidencia.crear('Buenos días')),
    EvaluacionProtocolo.crear(TipoProtocolo.DESPEDIDA, false, Evidencia.crear('No se despide')),
  ],
  alertas: [
    AlertaCumplimiento.crear(TipoAlerta.AMENAZA, SeveridadAlerta.ALTA, Evidencia.crear('le voy a denunciar')),
  ],
});

describe('presentarLlamada', () => {
  it('serializa la llamada a un DTO plano con la fecha en ISO 8601', () => {
    const dto = presentarLlamada(llamadaEjemplo);
    expect(dto).toEqual({
      id: 'llamada-001',
      agenteId: 'agente-7',
      fechaInicio: '2026-01-15T10:30:00.000Z',
      numeroIntervenciones: 2,
    });
  });

  it('produce un DTO serializable a JSON sin pérdida', () => {
    const dto = presentarLlamada(llamadaEjemplo);
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
  });
});

describe('presentarResultadoAuditoria', () => {
  it('serializa el resultado con la puntuación calculada por el dominio', () => {
    const dto = presentarResultadoAuditoria(resultadoEjemplo);
    expect(dto.id).toBe('auditoria-001');
    expect(dto.llamadaId).toBe('llamada-001');
    expect(dto.puntuacion).toBe(50);
    expect(dto.tieneAlertas).toBe(true);
  });

  it('expone la fecha de auditoría en ISO 8601', () => {
    const dto = presentarResultadoAuditoria(resultadoEjemplo);
    expect(dto.fechaAuditoria).toBe('2026-02-20T08:45:00.000Z');
  });

  it('expone cada evaluación y alerta como DTO plano con su evidencia', () => {
    const dto = presentarResultadoAuditoria(resultadoEjemplo);
    expect(dto.evaluaciones).toEqual([
      { protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días' },
      { protocolo: 'DESPEDIDA', cumplido: false, evidencia: 'No se despide' },
    ]);
    expect(dto.alertas).toEqual([
      { tipo: 'AMENAZA', severidad: 'ALTA', evidencia: 'le voy a denunciar' },
    ]);
  });

  it('presenta la revisión como null cuando la auditoría no ha sido revisada', () => {
    expect(presentarResultadoAuditoria(resultadoEjemplo).revision).toBeNull();
  });

  it('expone la revisión y las evaluaciones efectivas con la puntuación recalculada', () => {
    const revisado = ResultadoAuditoria.crear({
      id: AuditoriaId.crear('auditoria-002'),
      llamadaId: LlamadaId.crear('llamada-001'),
      fechaAuditoria: new Date('2026-02-20T08:45:00.000Z'),
      evaluaciones: [
        EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, Evidencia.crear('Buenos días')),
        EvaluacionProtocolo.crear(TipoProtocolo.DESPEDIDA, false, Evidencia.crear('No se despide')),
      ],
      alertas: [],
    });
    revisado.revisar({
      revisor: 'supervisor-01',
      fechaRevision: new Date('2026-06-26T09:00:00.000Z'),
      comentario: 'Corrijo la despedida.',
      correcciones: [
        EvaluacionProtocolo.crear(TipoProtocolo.DESPEDIDA, true, Evidencia.crear('Sí se despide al final')),
      ],
    });

    const dto = presentarResultadoAuditoria(revisado);

    expect(dto.puntuacion).toBe(100);
    expect(dto.revision).toEqual({
      revisor: 'supervisor-01',
      fechaRevision: '2026-06-26T09:00:00.000Z',
      comentario: 'Corrijo la despedida.',
      correcciones: [{ protocolo: 'DESPEDIDA', cumplido: true, evidencia: 'Sí se despide al final' }],
    });
    expect(dto.evaluaciones.find((e) => e.protocolo === 'DESPEDIDA')?.cumplido).toBe(true);
  });
});

describe('presentarInformeAgente', () => {
  it('serializa el informe del agente a un DTO plano', () => {
    const informe = InformeAgente.generar('agente-7', [resultadoEjemplo]);
    const dto = presentarInformeAgente(informe);
    expect(dto.agenteId).toBe('agente-7');
    expect(dto.numeroLlamadasAuditadas).toBe(1);
    expect(dto.puntuacionMedia).toBe(50);
    expect(dto.protocolosMasIncumplidos).toEqual([
      { protocolo: 'DESPEDIDA', incumplimientos: 1, evaluaciones: 1 },
      { protocolo: 'SALUDO_INICIAL', incumplimientos: 0, evaluaciones: 1 },
    ]);
    expect(dto.totalAlertas).toBe(1);
    expect(dto.alertasPorSeveridad).toEqual([{ severidad: 'ALTA', total: 1 }]);
  });

  it('produce un DTO serializable a JSON sin pérdida', () => {
    const dto = presentarInformeAgente(InformeAgente.generar('agente-7', []));
    expect(JSON.parse(JSON.stringify(dto))).toEqual(dto);
  });
});
