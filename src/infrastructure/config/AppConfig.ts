import { ConfiguracionInvalidaError } from '@infrastructure/config/ConfiguracionInvalidaError';

/** Modos de operación soportados por la aplicación. */
export type AppMode = 'demo' | 'production';

const MODOS_VALIDOS: readonly AppMode[] = ['demo', 'production'];

export interface AppConfig {
  readonly modo: AppMode;
}

/**
 * Construye la configuración a partir de variables de entorno.
 * Si APP_MODE no está definido se asume el Modo Demo (ejecución sin API keys).
 */
export function leerConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const modo = env.APP_MODE ?? 'demo';
  if (!MODOS_VALIDOS.includes(modo as AppMode)) {
    throw new ConfiguracionInvalidaError(
      `APP_MODE no reconocido: "${modo}". Valores admitidos: ${MODOS_VALIDOS.join(', ')}.`,
    );
  }
  return { modo: modo as AppMode };
}
