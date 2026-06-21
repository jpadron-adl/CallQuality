import { describe, it, expect } from 'vitest';
import { CargadorLlamadasSinteticas } from '@infrastructure/data/CargadorLlamadasSinteticas';
import { DatosSinteticosInvalidosError } from '@infrastructure/data/DatosSinteticosInvalidosError';

const cargador = new CargadorLlamadasSinteticas();

const datosValidos = [
  {
    id: 'llamada-001',
    agenteId: 'agente-007',
    fechaInicio: '2026-06-21T10:00:00.000Z',
    transcripcion: [
      { rol: 'AGENTE', texto: 'Buenos días, le atiende Ana' },
      { rol: 'CLIENTE', texto: 'Hola, tengo una consulta' },
    ],
  },
];

describe('CargadorLlamadasSinteticas', () => {
  it('mapea datos válidos a agregados Llamada', () => {
    const llamadas = cargador.mapear(datosValidos);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]?.id.valor).toBe('llamada-001');
    expect(llamadas[0]?.agenteId).toBe('agente-007');
    expect(llamadas[0]?.transcripcion.intervenciones).toHaveLength(2);
  });

  it('rechaza datos que no son un arreglo', () => {
    expect(() => cargador.mapear({ no: 'es-un-arreglo' })).toThrow(DatosSinteticosInvalidosError);
  });

  it('rechaza una llamada a la que le falta un campo obligatorio', () => {
    const invalidos = [{ id: 'llamada-001', agenteId: 'agente-007', transcripcion: [] }];
    expect(() => cargador.mapear(invalidos)).toThrow(DatosSinteticosInvalidosError);
  });

  it('rechaza una fecha con formato no válido', () => {
    const invalidos = [{ ...datosValidos[0], fechaInicio: 'no-es-fecha' }];
    expect(() => cargador.mapear(invalidos)).toThrow(DatosSinteticosInvalidosError);
  });

  it('rechaza un rol fuera del catálogo de intervinientes', () => {
    const invalidos = [
      { ...datosValidos[0], transcripcion: [{ rol: 'SUPERVISOR', texto: 'hola' }] },
    ];
    expect(() => cargador.mapear(invalidos)).toThrow(DatosSinteticosInvalidosError);
  });
});
