import { describe, it, expect } from 'vitest';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { DomainError } from '@domain/shared/DomainError';

describe('SeveridadAlerta', () => {
  it('expone los niveles del catálogo cerrado con su valor', () => {
    expect(SeveridadAlerta.BAJA.valor).toBe('BAJA');
    expect(SeveridadAlerta.MEDIA.valor).toBe('MEDIA');
    expect(SeveridadAlerta.ALTA.valor).toBe('ALTA');
    expect(SeveridadAlerta.CRITICA.valor).toBe('CRITICA');
  });

  it('rehidrata una severidad desde su valor textual normalizado', () => {
    expect(SeveridadAlerta.desde('  critica ').esIgualA(SeveridadAlerta.CRITICA)).toBe(true);
  });

  it('rechaza un valor fuera del catálogo', () => {
    expect(() => SeveridadAlerta.desde('LEVE')).toThrow(DomainError);
  });

  it('rechaza un valor vacío', () => {
    expect(() => SeveridadAlerta.desde('')).toThrow(DomainError);
  });

  it('compara gravedad: una severidad mayor es más grave que una menor', () => {
    expect(SeveridadAlerta.CRITICA.esMasGraveQue(SeveridadAlerta.BAJA)).toBe(true);
    expect(SeveridadAlerta.MEDIA.esMasGraveQue(SeveridadAlerta.ALTA)).toBe(false);
  });

  it('una severidad no es más grave que sí misma', () => {
    expect(SeveridadAlerta.ALTA.esMasGraveQue(SeveridadAlerta.ALTA)).toBe(false);
  });
});
