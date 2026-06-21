import { describe, it, expect } from 'vitest';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DomainError } from '@domain/shared/DomainError';

const transcripcionDemo = () =>
  Transcripcion.crear([Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días')]);

const crearLlamada = (overrides: Partial<Parameters<typeof Llamada.crear>[0]> = {}) =>
  Llamada.crear({
    id: LlamadaId.crear('llamada-001'),
    agenteId: 'agente-007',
    fechaInicio: new Date('2026-06-21T10:00:00.000Z'),
    transcripcion: transcripcionDemo(),
    ...overrides,
  });

describe('Llamada', () => {
  it('se crea con sus datos y los expone', () => {
    const llamada = crearLlamada();
    expect(llamada.id.valor).toBe('llamada-001');
    expect(llamada.agenteId).toBe('agente-007');
    expect(llamada.fechaInicio.toISOString()).toBe('2026-06-21T10:00:00.000Z');
    expect(llamada.transcripcion.intervenciones).toHaveLength(1);
  });

  it('rechaza un identificador de agente vacío', () => {
    expect(() => crearLlamada({ agenteId: '   ' })).toThrow(DomainError);
  });

  it('es inmutable: mutar la fecha de origen no afecta a la llamada', () => {
    const fechaInicio = new Date('2026-06-21T10:00:00.000Z');
    const llamada = crearLlamada({ fechaInicio });
    fechaInicio.setFullYear(1999);
    expect(llamada.fechaInicio.getFullYear()).toBe(2026);
  });

  it('es inmutable: mutar la fecha devuelta no afecta a la llamada', () => {
    const llamada = crearLlamada();
    llamada.fechaInicio.setFullYear(1999);
    expect(llamada.fechaInicio.getFullYear()).toBe(2026);
  });

  it('dos llamadas con el mismo identificador son iguales aunque difiera su contenido (igualdad por identidad)', () => {
    const a = crearLlamada({ agenteId: 'agente-007' });
    const b = crearLlamada({ agenteId: 'agente-999' });
    expect(a.esIgualA(b)).toBe(true);
  });

  it('dos llamadas con distinto identificador no son iguales', () => {
    const a = crearLlamada({ id: LlamadaId.crear('llamada-001') });
    const b = crearLlamada({ id: LlamadaId.crear('llamada-002') });
    expect(a.esIgualA(b)).toBe(false);
  });
});
