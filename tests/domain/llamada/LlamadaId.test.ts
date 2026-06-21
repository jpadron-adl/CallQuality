import { describe, it, expect } from 'vitest';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { DomainError } from '@domain/shared/DomainError';

describe('LlamadaId', () => {
  it('se crea con un valor válido y lo expone', () => {
    const id = LlamadaId.crear('llamada-001');
    expect(id.valor).toBe('llamada-001');
  });

  it('recorta los espacios en blanco de los extremos', () => {
    expect(LlamadaId.crear('  llamada-001  ').valor).toBe('llamada-001');
  });

  it('rechaza una cadena vacía', () => {
    expect(() => LlamadaId.crear('')).toThrow(DomainError);
  });

  it('rechaza una cadena en blanco (solo espacios)', () => {
    expect(() => LlamadaId.crear('   ')).toThrow(DomainError);
  });

  it('dos identificadores con el mismo valor son iguales (igualdad por valor)', () => {
    expect(LlamadaId.crear('llamada-001').esIgualA(LlamadaId.crear('llamada-001'))).toBe(true);
  });

  it('dos identificadores con distinto valor no son iguales', () => {
    expect(LlamadaId.crear('llamada-001').esIgualA(LlamadaId.crear('llamada-002'))).toBe(false);
  });
});
