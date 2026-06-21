import { describe, it, expect } from 'vitest';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { DomainError } from '@domain/shared/DomainError';

const cita = (texto = 'Le voy a denunciar') => Evidencia.crear(texto);

describe('AlertaCumplimiento', () => {
  it('se crea con tipo, severidad y evidencia, y los expone', () => {
    const alerta = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.CRITICA, cita());
    expect(alerta.tipo.esIgualA(TipoAlerta.FRAUDE)).toBe(true);
    expect(alerta.severidad.esIgualA(SeveridadAlerta.CRITICA)).toBe(true);
    expect(alerta.evidencia.esIgualA(cita())).toBe(true);
  });

  it('exige evidencia obligatoria (rechaza su ausencia)', () => {
    expect(() =>
      AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, undefined as unknown as Evidencia),
    ).toThrow(DomainError);
  });

  it('dos alertas con el mismo tipo, severidad y evidencia son iguales', () => {
    const a = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita());
    const b = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita());
    expect(a.esIgualA(b)).toBe(true);
  });

  it('difiere si cambia el tipo', () => {
    const a = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita());
    const b = AlertaCumplimiento.crear(TipoAlerta.AMENAZA, SeveridadAlerta.ALTA, cita());
    expect(a.esIgualA(b)).toBe(false);
  });

  it('difiere si cambia la severidad', () => {
    const a = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita());
    const b = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.BAJA, cita());
    expect(a.esIgualA(b)).toBe(false);
  });

  it('difiere si cambia la evidencia', () => {
    const a = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita('uno'));
    const b = AlertaCumplimiento.crear(TipoAlerta.FRAUDE, SeveridadAlerta.ALTA, cita('dos'));
    expect(a.esIgualA(b)).toBe(false);
  });
});
