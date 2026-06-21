import { describe, it, expect } from 'vitest';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DomainError } from '@domain/shared/DomainError';

describe('IntervinienteRol', () => {
  it('expone los roles del catálogo cerrado con su valor', () => {
    expect(IntervinienteRol.AGENTE.valor).toBe('AGENTE');
    expect(IntervinienteRol.CLIENTE.valor).toBe('CLIENTE');
    expect(IntervinienteRol.SISTEMA.valor).toBe('SISTEMA');
  });

  it('rehidrata un rol desde su valor textual', () => {
    expect(IntervinienteRol.desde('CLIENTE').esIgualA(IntervinienteRol.CLIENTE)).toBe(true);
  });

  it('normaliza mayúsculas y espacios al rehidratar', () => {
    expect(IntervinienteRol.desde('  agente ').esIgualA(IntervinienteRol.AGENTE)).toBe(true);
  });

  it('rechaza un valor fuera del catálogo', () => {
    expect(() => IntervinienteRol.desde('SUPERVISOR')).toThrow(DomainError);
  });

  it('rechaza un valor vacío', () => {
    expect(() => IntervinienteRol.desde('')).toThrow(DomainError);
  });

  it('ofrece comprobaciones semánticas de rol', () => {
    expect(IntervinienteRol.AGENTE.esAgente()).toBe(true);
    expect(IntervinienteRol.AGENTE.esCliente()).toBe(false);
    expect(IntervinienteRol.CLIENTE.esCliente()).toBe(true);
  });
});
