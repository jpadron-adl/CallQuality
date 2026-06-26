import { describe, it, expect } from 'vitest';
import {
  registrarLlamadaSchema,
  aComandoRegistrarLlamada,
} from '@infrastructure/web/RegistrarLlamadaSchema';

const cuerpoValido = {
  agenteId: 'agente-007',
  transcripcion: [
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

  it('ignora un identificador de llamada presente en el fichero (lo genera el sistema)', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, id: 'llamada-001' });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).not.toHaveProperty('id');
    }
  });

  it('rechaza un cuerpo sin identificador de agente', () => {
    const resultado = registrarLlamadaSchema.safeParse({ transcripcion: cuerpoValido.transcripcion });
    expect(resultado.success).toBe(false);
  });

  it('rechaza un agenteId vacío', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, agenteId: '   ' });
    expect(resultado.success).toBe(false);
  });

  it('rechaza una transcripción vacía', () => {
    const resultado = registrarLlamadaSchema.safeParse({ ...cuerpoValido, transcripcion: [] });
    expect(resultado.success).toBe(false);
  });

  it('rechaza una intervención con texto vacío', () => {
    const resultado = registrarLlamadaSchema.safeParse({
      ...cuerpoValido,
      transcripcion: [{ rol: 'AGENTE', texto: '   ' }],
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
