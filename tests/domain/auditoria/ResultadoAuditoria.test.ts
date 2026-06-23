import { describe, it, expect } from 'vitest';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { DomainError } from '@domain/shared/DomainError';

const cita = Evidencia.crear('cita de ejemplo');

const evaluacion = (tipo: TipoProtocolo, cumplido: boolean) =>
  EvaluacionProtocolo.crear(tipo, cumplido, cita);

const alerta = (tipo: TipoAlerta, severidad: SeveridadAlerta) =>
  AlertaCumplimiento.crear(tipo, severidad, cita);

const crearResultado = (overrides: Partial<Parameters<typeof ResultadoAuditoria.crear>[0]> = {}) =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear('auditoria-001'),
    llamadaId: LlamadaId.crear('llamada-001'),
    fechaAuditoria: new Date('2026-06-23T12:00:00.000Z'),
    evaluaciones: [
      evaluacion(TipoProtocolo.SALUDO_INICIAL, true),
      evaluacion(TipoProtocolo.DESPEDIDA, false),
    ],
    alertas: [],
    ...overrides,
  });

describe('ResultadoAuditoria', () => {
  it('se crea y expone su identidad y la referencia a la llamada', () => {
    const resultado = crearResultado();
    expect(resultado.id.valor).toBe('auditoria-001');
    expect(resultado.llamadaId.valor).toBe('llamada-001');
  });

  it('expone la fecha en que se realizó la auditoría', () => {
    const resultado = crearResultado({ fechaAuditoria: new Date('2026-06-23T12:00:00.000Z') });
    expect(resultado.fechaAuditoria.toISOString()).toBe('2026-06-23T12:00:00.000Z');
  });

  it('es inmutable frente a la fecha: mutar la fecha devuelta no altera el resultado', () => {
    const resultado = crearResultado();
    const fecha = resultado.fechaAuditoria;
    fecha.setFullYear(1999);
    expect(resultado.fechaAuditoria.getFullYear()).toBe(2026);
  });

  it('rechaza una auditoría sin evaluaciones (no se puede puntuar)', () => {
    expect(() => crearResultado({ evaluaciones: [] })).toThrow(DomainError);
  });

  it('calcula la puntuación como porcentaje de protocolos cumplidos', () => {
    const resultado = crearResultado({
      evaluaciones: [
        evaluacion(TipoProtocolo.SALUDO_INICIAL, true),
        evaluacion(TipoProtocolo.VALIDACION_IDENTIDAD, true),
        evaluacion(TipoProtocolo.OFERTA_OBLIGATORIA, false),
        evaluacion(TipoProtocolo.DESPEDIDA, false),
      ],
    });
    expect(resultado.puntuacion().valor).toBe(50);
  });

  it('redondea la puntuación al entero más cercano', () => {
    const resultado = crearResultado({
      evaluaciones: [
        evaluacion(TipoProtocolo.SALUDO_INICIAL, true),
        evaluacion(TipoProtocolo.VALIDACION_IDENTIDAD, false),
        evaluacion(TipoProtocolo.DESPEDIDA, false),
      ],
    });
    expect(resultado.puntuacion().valor).toBe(33);
  });

  it('indica si tiene alertas', () => {
    expect(crearResultado({ alertas: [] }).tieneAlertas()).toBe(false);
    expect(
      crearResultado({ alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA)] }).tieneAlertas(),
    ).toBe(true);
  });

  it('devuelve la alerta más grave', () => {
    const resultado = crearResultado({
      alertas: [
        alerta(TipoAlerta.QUEJA_GRAVE, SeveridadAlerta.MEDIA),
        alerta(TipoAlerta.FRAUDE, SeveridadAlerta.CRITICA),
        alerta(TipoAlerta.LENGUAJE_OFENSIVO, SeveridadAlerta.BAJA),
      ],
    });
    expect(resultado.alertaMasGrave()?.severidad.esIgualA(SeveridadAlerta.CRITICA)).toBe(true);
  });

  it('devuelve null como alerta más grave cuando no hay alertas', () => {
    expect(crearResultado({ alertas: [] }).alertaMasGrave()).toBeNull();
  });

  it('es inmutable: mutar las listas devueltas no altera el resultado', () => {
    const resultado = crearResultado();
    resultado.evaluaciones.push(evaluacion(TipoProtocolo.OFERTA_OBLIGATORIA, true));
    resultado.alertas.push(alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA));
    expect(resultado.evaluaciones).toHaveLength(2);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('compara por identidad (AuditoriaId)', () => {
    const a = crearResultado({ id: AuditoriaId.crear('auditoria-001') });
    const b = crearResultado({ id: AuditoriaId.crear('auditoria-001'), alertas: [alerta(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA)] });
    const c = crearResultado({ id: AuditoriaId.crear('auditoria-002') });
    expect(a.esIgualA(b)).toBe(true);
    expect(a.esIgualA(c)).toBe(false);
  });
});
