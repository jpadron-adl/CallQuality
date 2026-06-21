import { describe, it, expect } from 'vitest';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DomainError } from '@domain/shared/DomainError';

describe('Intervencion', () => {
  it('se crea con un rol y un texto válidos', () => {
    const intervencion = Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días, le atiende Ana.');
    expect(intervencion.rol.esIgualA(IntervinienteRol.AGENTE)).toBe(true);
    expect(intervencion.texto).toBe('Buenos días, le atiende Ana.');
  });

  it('recorta los espacios en blanco de los extremos del texto', () => {
    const intervencion = Intervencion.crear(IntervinienteRol.CLIENTE, '  hola  ');
    expect(intervencion.texto).toBe('hola');
  });

  it('rechaza un texto vacío', () => {
    expect(() => Intervencion.crear(IntervinienteRol.CLIENTE, '')).toThrow(DomainError);
  });

  it('rechaza un texto en blanco (solo espacios)', () => {
    expect(() => Intervencion.crear(IntervinienteRol.CLIENTE, '   ')).toThrow(DomainError);
  });

  it('dos intervenciones con el mismo rol y texto son iguales (igualdad estructural)', () => {
    const a = Intervencion.crear(IntervinienteRol.AGENTE, 'hola');
    const b = Intervencion.crear(IntervinienteRol.AGENTE, 'hola');
    expect(a.esIgualA(b)).toBe(true);
  });

  it('difiere si cambia el rol', () => {
    const a = Intervencion.crear(IntervinienteRol.AGENTE, 'hola');
    const b = Intervencion.crear(IntervinienteRol.CLIENTE, 'hola');
    expect(a.esIgualA(b)).toBe(false);
  });

  it('difiere si cambia el texto', () => {
    const a = Intervencion.crear(IntervinienteRol.AGENTE, 'hola');
    const b = Intervencion.crear(IntervinienteRol.AGENTE, 'adiós');
    expect(a.esIgualA(b)).toBe(false);
  });
});
