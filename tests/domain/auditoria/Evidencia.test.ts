import { describe, it, expect } from 'vitest';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { DomainError } from '@domain/shared/DomainError';

describe('Evidencia', () => {
  it('se crea con una cita textual y la expone', () => {
    const evidencia = Evidencia.crear('Buenos días, le atiende Ana.');
    expect(evidencia.valor).toBe('Buenos días, le atiende Ana.');
  });

  it('recorta los espacios en blanco de los extremos', () => {
    expect(Evidencia.crear('  hola  ').valor).toBe('hola');
  });

  it('rechaza una cita vacía', () => {
    expect(() => Evidencia.crear('')).toThrow(DomainError);
  });

  it('rechaza una cita en blanco (solo espacios)', () => {
    expect(() => Evidencia.crear('   ')).toThrow(DomainError);
  });

  it('dos evidencias con la misma cita son iguales (igualdad por valor)', () => {
    expect(Evidencia.crear('hola').esIgualA(Evidencia.crear('hola'))).toBe(true);
  });

  it('dos evidencias con distinta cita no son iguales', () => {
    expect(Evidencia.crear('hola').esIgualA(Evidencia.crear('adiós'))).toBe(false);
  });
});
