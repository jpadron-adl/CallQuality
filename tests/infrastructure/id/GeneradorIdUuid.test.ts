import { describe, it, expect } from 'vitest';
import { GeneradorIdUuid } from '@infrastructure/id/GeneradorIdUuid';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('GeneradorIdUuid', () => {
  it('genera un identificador con formato UUID', () => {
    expect(new GeneradorIdUuid().siguiente()).toMatch(FORMATO_UUID);
  });

  it('genera identificadores distintos en llamadas sucesivas', () => {
    const generador = new GeneradorIdUuid();
    expect(generador.siguiente()).not.toBe(generador.siguiente());
  });
});
