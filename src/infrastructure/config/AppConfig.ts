import { ConfiguracionInvalidaError } from '@infrastructure/config/ConfiguracionInvalidaError';

/** Modos de operación soportados por la aplicación. */
export type AppMode = 'demo' | 'production';

const MODOS_VALIDOS: readonly AppMode[] = ['demo', 'production'];

/** Modelo de OpenAI por defecto cuando no se especifica OPENAI_MODEL. */
const MODELO_OPENAI_POR_DEFECTO = 'gpt-4o-mini';

/** Configuración del proveedor de IA para el Modo Producción. */
export interface OpenAiConfig {
  readonly apiKey: string;
  readonly modelo: string;
}

export interface AppConfig {
  readonly modo: AppMode;
  /** Presente solo en modo producción; el modo demo no usa proveedor de IA. */
  readonly openai?: OpenAiConfig;
}

/**
 * Construye la configuración a partir de variables de entorno.
 * Si APP_MODE no está definido se asume el Modo Demo (ejecución sin API keys).
 * En modo producción exige OPENAI_API_KEY y resuelve OPENAI_MODEL (con valor por defecto).
 */
export function leerConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const modo = env.APP_MODE ?? 'demo';
  if (!MODOS_VALIDOS.includes(modo as AppMode)) {
    throw new ConfiguracionInvalidaError(
      `APP_MODE no reconocido: "${modo}". Valores admitidos: ${MODOS_VALIDOS.join(', ')}.`,
    );
  }

  if (modo === 'production') {
    const apiKey = env.OPENAI_API_KEY;
    if (apiKey === undefined || apiKey.trim().length === 0) {
      throw new ConfiguracionInvalidaError(
        'El modo producción requiere la variable de entorno OPENAI_API_KEY.',
      );
    }
    return {
      modo,
      openai: { apiKey, modelo: env.OPENAI_MODEL ?? MODELO_OPENAI_POR_DEFECTO },
    };
  }

  return { modo: 'demo' };
}
