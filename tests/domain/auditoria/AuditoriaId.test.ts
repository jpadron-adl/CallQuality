import { describe, it, expect } from 'vitest';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { DomainError } from '@domain/shared/DomainError';

describe('AuditoriaId', () => {
  it('se crea con un valor válido y lo expone', () => {
    expect(AuditoriaId.crear('auditoria-001').valor).toBe('auditoria-001');
  });

  it('recorta los espacios en blanco de los extremos', () => {
    expect(AuditoriaId.crear('  auditoria-001  ').valor).toBe('auditoria-001');
  });

  it('rechaza una cadena vacía o en blanco', () => {
    expect(() => AuditoriaId.crear('')).toThrow(DomainError);
    expect(() => AuditoriaId.crear('   ')).toThrow(DomainError);
  });

  it('compara por valor', () => {
    expect(AuditoriaId.crear('a-1').esIgualA(AuditoriaId.crear('a-1'))).toBe(true);
    expect(AuditoriaId.crear('a-1').esIgualA(AuditoriaId.crear('a-2'))).toBe(false);
  });
});
