import { describe, it, expect } from 'vitest';
import {
  registrarLlamadaSchema,
  aComandoRegistrarLlamada,
} from '@infrastructure/web/RegistrarLlamadaSchema';

const cuerpoValido = {
  agenteId: 'agente-007',
  intervenciones: [
    { rol: 'AGENTE', texto: 'Buenos días' },
    { rol: 'CLIENTE', texto: 'Hola' },
  ],
};

describe('registrarLlamadaSchema', () => {
  it('acepta un cuerpo bien formado sin fecha de inicio', () => {
    const resultado = registrarLlamadaSchema.safeParse(cuerpoValido);
    expect(resultado.success).toBe(true);
  });

  it('acepta una fecha de inicio en formato ISO 8601', () => {
    const resultado = registrarLlamadaSchema.safeParse({
      ...cuerpoValido,
      fechaInicio: '2026-05-10T12:30:00.000Z',
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza un cuerpo sin identificador de agente', () => {
    const resultado = registrarLlamadaSchema.safeParse({ intervenciones: cuerpoValido.intervenciones });
    expect(resultado.success).toBe(false);
  });

  it('rechaza un agenteId vacío', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, agenteId: '   ' });
    expect(resultado.success).toBe(false);
  });

  it('rechaza una lista de intervenciones vacía', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, intervenciones: [] });
    expect(resultado.success).toBe(false);
  });

  it('rechaza una intervención con texto vacío', () => {
    const resultado = registrarLlamadaSchema.safeParse({
      ...cuerpoValido,
      intervenciones: [{ rol: 'AGENTE', texto: '   ' }],
    });
    expect(resultado.success).toBe(false);
  });

  it('rechaza una fecha de inicio que no es ISO 8601', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, fechaInicio: '10/05/2026' });
    expect(resultado.success).toBe(false);
  });
});

describe('aComandoRegistrarLlamada', () => {
  it('traduce el cuerpo validado a un comando del caso de uso', () => {
    const comando = aComandoRegistrarLlamada(registrarLlamadaSchema.parse(cuerpoValido));
    expect(comando.agenteId).toBe('agente-007');
    expect(comando.intervenciones).toHaveLength(2);
    expect(comando.fechaInicio).toBeUndefined();
  });

  it('convierte la fecha de inicio ISO a un objeto Date', () => {
    const comando = aComandoRegistrarLlamada(
      registrarLlamadaSchema.parse({ ...cuerpoValido, fechaInicio: '2026-05-10T12:30:00.000Z' }),
    );
    expect(comando.fechaInicio).toBeInstanceOf(Date);
    expect(comando.fechaInicio?.toISOString()).toBe('2026-05-10T12:30:00.000Z');
  });
});
