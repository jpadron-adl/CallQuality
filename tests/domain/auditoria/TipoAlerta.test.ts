import { describe, it, expect } from 'vitest';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { DomainError } from '@domain/shared/DomainError';

describe('TipoAlerta', () => {
  it('expone los tipos del catálogo cerrado con su valor', () => {
    expect(TipoAlerta.FRAUDE.valor).toBe('FRAUDE');
    expect(TipoAlerta.QUEJA_GRAVE.valor).toBe('QUEJA_GRAVE');
    expect(TipoAlerta.AMENAZA.valor).toBe('AMENAZA');
    expect(TipoAlerta.LENGUAJE_OFENSIVO.valor).toBe('LENGUAJE_OFENSIVO');
  });

  it('rehidrata un tipo desde su valor textual normalizado', () => {
    expect(TipoAlerta.desde('  fraude ').esIgualA(TipoAlerta.FRAUDE)).toBe(true);
  });

  it('rechaza un valor fuera del catálogo', () => {
    expect(() => TipoAlerta.desde('SPAM')).toThrow(DomainError);
  });

  it('rechaza un valor vacío', () => {
    expect(() => TipoAlerta.desde('')).toThrow(DomainError);
  });
});
