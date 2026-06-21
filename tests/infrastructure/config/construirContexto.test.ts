import { describe, it, expect } from 'vitest';
import { construirContexto } from '@infrastructure/config/construirContexto';
import { leerConfig } from '@infrastructure/config/AppConfig';
import { ConfiguracionInvalidaError } from '@infrastructure/config/ConfiguracionInvalidaError';
import { AdaptadorNoDisponibleError } from '@infrastructure/config/AdaptadorNoDisponibleError';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

describe('leerConfig', () => {
  it('usa el modo demo por defecto cuando APP_MODE no está definido', () => {
    expect(leerConfig({}).modo).toBe('demo');
  });

  it('lee el modo desde APP_MODE', () => {
    expect(leerConfig({ APP_MODE: 'production' }).modo).toBe('production');
  });

  it('rechaza un APP_MODE no reconocido', () => {
    expect(() => leerConfig({ APP_MODE: 'staging' })).toThrow(ConfiguracionInvalidaError);
  });
});

describe('construirContexto', () => {
  it('en modo demo siembra el repositorio con las llamadas sintéticas', async () => {
    const contexto = construirContexto({ modo: 'demo' });
    const pendientes = await contexto.llamadas.listarPendientesDeAuditar();
    expect(pendientes.length).toBeGreaterThanOrEqual(1);
  });

  it('en modo demo audita una llamada de extremo a extremo', async () => {
    const contexto = construirContexto({ modo: 'demo' });
    const resultado = await contexto.auditarLlamada.ejecutar(LlamadaId.crear('llamada-001'));
    expect(resultado.puntuacion().valor).toBeGreaterThanOrEqual(0);
    expect(resultado.puntuacion().valor).toBeLessThanOrEqual(100);
  });

  it('en modo demo detecta alertas en la llamada problemática', async () => {
    const contexto = construirContexto({ modo: 'demo' });
    const resultado = await contexto.auditarLlamada.ejecutar(LlamadaId.crear('llamada-002'));
    expect(resultado.tieneAlertas()).toBe(true);
  });

  it('en modo production indica que el adaptador real aún no está disponible', () => {
    expect(() => construirContexto({ modo: 'production' })).toThrow(AdaptadorNoDisponibleError);
  });
});
