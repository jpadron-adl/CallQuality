import { describe, it, expect } from 'vitest';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { DomainError } from '@domain/shared/DomainError';

const cita = (texto = 'Buenos días, le atiende Ana.') => Evidencia.crear(texto);

describe('EvaluacionProtocolo', () => {
  it('se crea para un protocolo cumplido con su evidencia', () => {
    const evaluacion = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita());
    expect(evaluacion.tipo.esIgualA(TipoProtocolo.SALUDO_INICIAL)).toBe(true);
    expect(evaluacion.cumplido).toBe(true);
    expect(evaluacion.evidencia.esIgualA(cita())).toBe(true);
  });

  it('se crea para un protocolo incumplido con su evidencia', () => {
    const evaluacion = EvaluacionProtocolo.crear(TipoProtocolo.DESPEDIDA, false, cita('No hubo despedida'));
    expect(evaluacion.cumplido).toBe(false);
  });

  it('exige evidencia obligatoria (rechaza su ausencia)', () => {
    expect(() =>
      EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, undefined as unknown as Evidencia),
    ).toThrow(DomainError);
  });

  it('dos evaluaciones con el mismo tipo, resultado y evidencia son iguales', () => {
    const a = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita());
    const b = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita());
    expect(a.esIgualA(b)).toBe(true);
  });

  it('difiere si cambia el resultado de cumplimiento', () => {
    const a = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita());
    const b = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, false, cita());
    expect(a.esIgualA(b)).toBe(false);
  });

  it('difiere si cambia el tipo de protocolo', () => {
    const a = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita());
    const b = EvaluacionProtocolo.crear(TipoProtocolo.DESPEDIDA, true, cita());
    expect(a.esIgualA(b)).toBe(false);
  });

  it('difiere si cambia la evidencia', () => {
    const a = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita('hola'));
    const b = EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita('adiós'));
    expect(a.esIgualA(b)).toBe(false);
  });
});
