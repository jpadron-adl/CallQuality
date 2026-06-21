import { describe, it, expect } from 'vitest';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DomainError } from '@domain/shared/DomainError';

const agente = (texto: string) => Intervencion.crear(IntervinienteRol.AGENTE, texto);
const cliente = (texto: string) => Intervencion.crear(IntervinienteRol.CLIENTE, texto);

describe('Transcripcion', () => {
  it('se crea con una lista de intervenciones y las expone en orden', () => {
    const turnos = [agente('Buenos días'), cliente('Hola')];
    const transcripcion = Transcripcion.crear(turnos);
    expect(transcripcion.intervenciones).toHaveLength(2);
    expect(transcripcion.intervenciones[0]?.esIgualA(agente('Buenos días'))).toBe(true);
  });

  it('rechaza una transcripción sin intervenciones', () => {
    expect(() => Transcripcion.crear([])).toThrow(DomainError);
  });

  it('es inmutable: mutar la lista de origen no afecta a la transcripción', () => {
    const turnos = [agente('Buenos días')];
    const transcripcion = Transcripcion.crear(turnos);
    turnos.push(cliente('intruso'));
    expect(transcripcion.intervenciones).toHaveLength(1);
  });

  it('es inmutable: mutar la lista devuelta no afecta a la transcripción', () => {
    const transcripcion = Transcripcion.crear([agente('Buenos días')]);
    transcripcion.intervenciones.push(cliente('intruso'));
    expect(transcripcion.intervenciones).toHaveLength(1);
  });

  it('expone el primer turno', () => {
    const transcripcion = Transcripcion.crear([agente('Buenos días'), cliente('Hola')]);
    expect(transcripcion.primerTurno().esIgualA(agente('Buenos días'))).toBe(true);
  });

  it('expone el último turno', () => {
    const transcripcion = Transcripcion.crear([agente('Buenos días'), cliente('Adiós')]);
    expect(transcripcion.ultimoTurno().esIgualA(cliente('Adiós'))).toBe(true);
  });

  it('indica si un rol intervino', () => {
    const transcripcion = Transcripcion.crear([agente('Buenos días')]);
    expect(transcripcion.intervino(IntervinienteRol.AGENTE)).toBe(true);
    expect(transcripcion.intervino(IntervinienteRol.CLIENTE)).toBe(false);
  });

  it('filtra las intervenciones de un rol concreto', () => {
    const transcripcion = Transcripcion.crear([
      agente('Buenos días'),
      cliente('Hola'),
      agente('¿En qué puedo ayudarle?'),
    ]);
    expect(transcripcion.intervencionesDe(IntervinienteRol.AGENTE)).toHaveLength(2);
    expect(transcripcion.intervencionesDe(IntervinienteRol.CLIENTE)).toHaveLength(1);
  });
});
