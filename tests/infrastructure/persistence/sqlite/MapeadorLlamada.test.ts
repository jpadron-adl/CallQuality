import { describe, it, expect } from 'vitest';
import {
  serializarLlamada,
  deserializarLlamada,
} from '@infrastructure/persistence/sqlite/MapeadorLlamada';
import { PersistenciaCorruptaError } from '@infrastructure/persistence/sqlite/PersistenciaCorruptaError';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

const llamadaEjemplo = (): Llamada =>
  Llamada.crear({
    id: LlamadaId.crear('llamada-1'),
    agenteId: 'AGENTE_007',
    fechaInicio: new Date('2026-06-24T10:30:00.000Z'),
    transcripcion: Transcripcion.crear([
      Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días, le atiende Ana'),
      Intervencion.crear(IntervinienteRol.CLIENTE, 'Hola, necesito ayuda'),
    ]),
  });

describe('MapeadorLlamada', () => {
  it('serializa una llamada a una fila plana con la transcripción como JSON', () => {
    const fila = serializarLlamada(llamadaEjemplo());

    expect(fila.id).toBe('llamada-1');
    expect(fila.agenteId).toBe('AGENTE_007');
    expect(fila.fechaInicio).toBe('2026-06-24T10:30:00.000Z');
    expect(JSON.parse(fila.transcripcion)).toEqual([
      { rol: 'AGENTE', texto: 'Buenos días, le atiende Ana' },
      { rol: 'CLIENTE', texto: 'Hola, necesito ayuda' },
    ]);
  });

  it('reconstruye la llamada equivalente al deserializar (ida y vuelta)', () => {
    const original = llamadaEjemplo();

    const reconstruida = deserializarLlamada(serializarLlamada(original));

    expect(reconstruida.esIgualA(original)).toBe(true);
    expect(reconstruida.agenteId).toBe(original.agenteId);
    expect(reconstruida.fechaInicio.getTime()).toBe(original.fechaInicio.getTime());
    const turnos = reconstruida.transcripcion.intervenciones;
    expect(turnos).toHaveLength(2);
    expect(turnos[0]?.rol.valor).toBe('AGENTE');
    expect(turnos[0]?.texto).toBe('Buenos días, le atiende Ana');
    expect(turnos[1]?.rol.valor).toBe('CLIENTE');
    expect(turnos[1]?.texto).toBe('Hola, necesito ayuda');
  });

  it('lanza PersistenciaCorruptaError si la transcripción almacenada no es JSON válido', () => {
    const fila = { ...serializarLlamada(llamadaEjemplo()), transcripcion: 'esto no es json' };

    expect(() => deserializarLlamada(fila)).toThrow(PersistenciaCorruptaError);
  });

  it('lanza PersistenciaCorruptaError si la transcripción almacenada viola el esquema', () => {
    const fila = {
      ...serializarLlamada(llamadaEjemplo()),
      transcripcion: JSON.stringify([{ rol: 'EXTRATERRESTRE', texto: 'hola' }]),
    };

    expect(() => deserializarLlamada(fila)).toThrow(PersistenciaCorruptaError);
  });
});
