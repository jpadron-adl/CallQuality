import { describe, it, expect } from 'vitest';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { DomainError } from '@domain/shared/DomainError';

describe('TipoProtocolo', () => {
  it('expone los tipos del catálogo cerrado con su valor', () => {
    expect(TipoProtocolo.SALUDO_INICIAL.valor).toBe('SALUDO_INICIAL');
    expect(TipoProtocolo.VALIDACION_IDENTIDAD.valor).toBe('VALIDACION_IDENTIDAD');
    expect(TipoProtocolo.OFERTA_OBLIGATORIA.valor).toBe('OFERTA_OBLIGATORIA');
    expect(TipoProtocolo.LENGUAJE_ADECUADO.valor).toBe('LENGUAJE_ADECUADO');
    expect(TipoProtocolo.DESPEDIDA.valor).toBe('DESPEDIDA');
  });

  it('rehidrata un tipo desde su valor textual', () => {
    expect(TipoProtocolo.desde('OFERTA_OBLIGATORIA').esIgualA(TipoProtocolo.OFERTA_OBLIGATORIA)).toBe(true);
  });

  it('normaliza mayúsculas y espacios al rehidratar', () => {
    expect(TipoProtocolo.desde('  saludo_inicial ').esIgualA(TipoProtocolo.SALUDO_INICIAL)).toBe(true);
  });

  it('rechaza un valor fuera del catálogo', () => {
    expect(() => TipoProtocolo.desde('VENTA_CRUZADA')).toThrow(DomainError);
  });

  it('rechaza un valor vacío', () => {
    expect(() => TipoProtocolo.desde('')).toThrow(DomainError);
  });

  it('expone el catálogo completo de protocolos auditables', () => {
    expect(TipoProtocolo.todos()).toHaveLength(5);
  });
});
