import { describe, it, expect } from 'vitest';
import { construirContexto } from '@infrastructure/config/construirContexto';
import { leerConfig } from '@infrastructure/config/AppConfig';
import { ConfiguracionInvalidaError } from '@infrastructure/config/ConfiguracionInvalidaError';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

describe('leerConfig', () => {
  it('usa el modo demo por defecto cuando APP_MODE no está definido', () => {
    expect(leerConfig({}).modo).toBe('demo');
  });

  it('lee el modo desde APP_MODE', () => {
    expect(leerConfig({ APP_MODE: 'production', OPENAI_API_KEY: 'sk-test' }).modo).toBe('production');
  });

  it('rechaza un APP_MODE no reconocido', () => {
    expect(() => leerConfig({ APP_MODE: 'staging' })).toThrow(ConfiguracionInvalidaError);
  });

  it('no expone configuración de OpenAI en modo demo', () => {
    expect(leerConfig({ APP_MODE: 'demo' }).openai).toBeUndefined();
  });

  it('lee la API key y el modelo de OpenAI en modo producción', () => {
    const config = leerConfig({
      APP_MODE: 'production',
      OPENAI_API_KEY: 'sk-test',
      OPENAI_MODEL: 'gpt-4o',
    });
    expect(config.openai?.apiKey).toBe('sk-test');
    expect(config.openai?.modelo).toBe('gpt-4o');
  });

  it('aplica un modelo por defecto cuando OPENAI_MODEL no está definido en producción', () => {
    const config = leerConfig({ APP_MODE: 'production', OPENAI_API_KEY: 'sk-test' });
    expect(config.openai?.modelo).toBeDefined();
    expect(config.openai?.modelo.length).toBeGreaterThan(0);
  });

  it('rechaza el modo producción sin OPENAI_API_KEY', () => {
    expect(() => leerConfig({ APP_MODE: 'production' })).toThrow(ConfiguracionInvalidaError);
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

  it('en modo production ensambla el contexto con el adaptador de IA real', () => {
    const contexto = construirContexto({
      modo: 'production',
      openai: { apiKey: 'sk-test', modelo: 'gpt-4o-mini' },
    });
    expect(contexto.auditarLlamada).toBeDefined();
    expect(contexto.llamadas).toBeDefined();
    expect(contexto.auditorias).toBeDefined();
  });
});
