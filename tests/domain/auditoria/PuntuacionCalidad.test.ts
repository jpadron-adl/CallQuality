import { describe, it, expect } from 'vitest';
import { PuntuacionCalidad } from '@domain/auditoria/value-objects/PuntuacionCalidad';
import { DomainError } from '@domain/shared/DomainError';

describe('PuntuacionCalidad', () => {
  it('se crea con un valor válido dentro del rango 0–100', () => {
    const puntuacion = PuntuacionCalidad.crear(85);
    expect(puntuacion.valor).toBe(85);
  });

  it('admite los límites del rango (0 y 100)', () => {
    expect(PuntuacionCalidad.crear(0).valor).toBe(0);
    expect(PuntuacionCalidad.crear(100).valor).toBe(100);
  });

  it('rechaza valores por debajo de 0', () => {
    expect(() => PuntuacionCalidad.crear(-1)).toThrow(DomainError);
  });

  it('rechaza valores por encima de 100', () => {
    expect(() => PuntuacionCalidad.crear(101)).toThrow(DomainError);
  });

  it('rechaza valores no enteros', () => {
    expect(() => PuntuacionCalidad.crear(85.5)).toThrow(DomainError);
  });

  it('rechaza valores no numéricos (NaN)', () => {
    expect(() => PuntuacionCalidad.crear(Number.NaN)).toThrow(DomainError);
  });

  it('dos puntuaciones con el mismo valor son iguales (igualdad por valor)', () => {
    expect(PuntuacionCalidad.crear(70).esIgualA(PuntuacionCalidad.crear(70))).toBe(true);
  });

  it('dos puntuaciones con distinto valor no son iguales', () => {
    expect(PuntuacionCalidad.crear(70).esIgualA(PuntuacionCalidad.crear(71))).toBe(false);
  });
});
