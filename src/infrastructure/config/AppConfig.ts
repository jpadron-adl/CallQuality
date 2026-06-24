import { ConfiguracionInvalidaError } from '@infrastructure/config/ConfiguracionInvalidaError';

/** Modos de operación soportados por la aplicación. */
export type AppMode = 'demo' | 'production';

const MODOS_VALIDOS: readonly AppMode[] = ['demo', 'production'];

/** Tecnologías de persistencia soportadas. */
export type TipoPersistencia = 'memoria' | 'sqlite';

const PERSISTENCIAS_VALIDAS: readonly TipoPersistencia[] = ['memoria', 'sqlite'];

/** Modelo de OpenAI por defecto cuando no se especifica OPENAI_MODEL. */
const MODELO_OPENAI_POR_DEFECTO = 'gpt-4o-mini';

/** Ruta del fichero SQLite por defecto cuando no se especifica DB_PATH. */
const DB_PATH_POR_DEFECTO = 'callquality.sqlite';

/** Configuración del proveedor de IA para el Modo Producción. */
export interface OpenAiConfig {
  readonly apiKey: string;
  readonly modelo: string;
}

export interface AppConfig {
  readonly modo: AppMode;
  /** Tecnología de persistencia; por defecto en memoria (sin estado entre arranques). */
  readonly persistencia?: TipoPersistencia;
  /** Ruta del fichero SQLite; presente solo con persistencia sqlite. */
  readonly dbPath?: string;
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

  const persistencia = leerPersistencia(env);
  // dbPath solo se incluye con sqlite (exactOptionalPropertyTypes: no se asigna undefined).
  const base: AppConfig =
    persistencia === 'sqlite'
      ? { modo: modo as AppMode, persistencia, dbPath: env.DB_PATH ?? DB_PATH_POR_DEFECTO }
      : { modo: modo as AppMode, persistencia };

  if (modo === 'production') {
    const apiKey = env.OPENAI_API_KEY;
    if (apiKey === undefined || apiKey.trim().length === 0) {
      throw new ConfiguracionInvalidaError(
        'El modo producción requiere la variable de entorno OPENAI_API_KEY.',
      );
    }
    return {
      ...base,
      openai: { apiKey, modelo: env.OPENAI_MODEL ?? MODELO_OPENAI_POR_DEFECTO },
    };
  }

  return base;
}

/** Resuelve y valida la tecnología de persistencia (por defecto en memoria). */
function leerPersistencia(env: Record<string, string | undefined>): TipoPersistencia {
  const persistencia = env.PERSISTENCIA ?? 'memoria';
  if (!PERSISTENCIAS_VALIDAS.includes(persistencia as TipoPersistencia)) {
    throw new ConfiguracionInvalidaError(
      `PERSISTENCIA no reconocida: "${persistencia}". Valores admitidos: ${PERSISTENCIAS_VALIDAS.join(', ')}.`,
    );
  }
  return persistencia as TipoPersistencia;
}
