import { describe, it, expect } from 'vitest';
import { RelojDelSistema } from '@infrastructure/tiempo/RelojDelSistema';

describe('RelojDelSistema', () => {
  it('devuelve un Date', () => {
    expect(new RelojDelSistema().ahora()).toBeInstanceOf(Date);
  });

  it('devuelve un instante próximo al tiempo real del sistema', () => {
    const margenMs = 1000;
    const antes = Date.now();
    const instante = new RelojDelSistema().ahora().getTime();
    const despues = Date.now();
    expect(instante).toBeGreaterThanOrEqual(antes - margenMs);
    expect(instante).toBeLessThanOrEqual(despues + margenMs);
  });
});
