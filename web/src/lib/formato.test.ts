import { describe, it, expect } from 'vitest';
import { formatearFechaHora } from '@/lib/formato';

describe('formatearFechaHora', () => {
  it('formatea una fecha ISO en es-ES y zona UTC de forma determinista', () => {
    expect(formatearFechaHora('2026-06-20T09:05:00.000Z')).toBe('20/06/2026, 09:05');
  });

  it('devuelve la cadena original si no es una fecha válida', () => {
    expect(formatearFechaHora('no-es-fecha')).toBe('no-es-fecha');
  });
});
