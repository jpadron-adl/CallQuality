import { ApiError } from '@/api/ApiError';
import type {
  ComparacionAuditoriasDto,
  InformeAgenteDto,
  LlamadaDto,
  NuevaLlamada,
  NuevaRevision,
  ResultadoAuditoriaDto,
} from '@/api/tipos';

/** Función `fetch` (inyectable para testear sin red ni dependencia del global). */
export type FetchFn = (entrada: string, init?: RequestInit) => Promise<Response>;

export interface OpcionesClienteAuditoria {
  /** Prefijo de las rutas (vacío en desarrollo gracias al proxy de Vite). */
  readonly baseUrl?: string;
  /** Implementación de fetch; por defecto la global del navegador. */
  readonly fetch?: FetchFn;
}

/** Cliente del dashboard contra la API de auditoría. */
export interface ClienteAuditoria {
  listarLlamadas(): Promise<LlamadaDto[]>;
  auditarLlamada(llamadaId: string): Promise<ResultadoAuditoriaDto>;
  listarAuditorias(llamadaId: string): Promise<ResultadoAuditoriaDto[]>;
  registrarLlamada(nueva: NuevaLlamada): Promise<LlamadaDto>;
  revisarAuditoria(auditoriaId: string, revision: NuevaRevision): Promise<ResultadoAuditoriaDto>;
  obtenerInformeAgente(agenteId: string): Promise<InformeAgenteDto>;
  compararAuditorias(auditoriaIdA: string, auditoriaIdB: string): Promise<ComparacionAuditoriasDto>;
}

/**
 * Crea el cliente de la API. Inyectar `fetch` y `baseUrl` permite probar el cliente con
 * dobles en memoria y reutilizarlo contra distintos orígenes sin acoplar la lógica al
 * `window.fetch` global. Traduce las respuestas no-ok en `ApiError` con su estado.
 */
export function crearClienteAuditoria(opciones: OpcionesClienteAuditoria = {}): ClienteAuditoria {
  const baseUrl = opciones.baseUrl ?? '';
  const fetchFn: FetchFn = opciones.fetch ?? ((entrada, init) => fetch(entrada, init));

  async function pedir<T>(ruta: string, metodo: 'GET' | 'POST', cuerpo?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';

    const init: RequestInit = { method: metodo, headers };
    if (cuerpo !== undefined) init.body = JSON.stringify(cuerpo);

    const respuesta = await fetchFn(`${baseUrl}${ruta}`, init);

    if (!respuesta.ok) {
      throw new ApiError(respuesta.status, await extraerMensajeError(respuesta));
    }

    return (await respuesta.json()) as T;
  }

  return {
    listarLlamadas() {
      return pedir<LlamadaDto[]>('/api/llamadas', 'GET');
    },
    auditarLlamada(llamadaId) {
      return pedir<ResultadoAuditoriaDto>(`/api/llamadas/${encodeURIComponent(llamadaId)}/auditorias`, 'POST');
    },
    listarAuditorias(llamadaId) {
      return pedir<ResultadoAuditoriaDto[]>(`/api/llamadas/${encodeURIComponent(llamadaId)}/auditorias`, 'GET');
    },
    registrarLlamada(nueva) {
      return pedir<LlamadaDto>('/api/llamadas', 'POST', nueva);
    },
    revisarAuditoria(auditoriaId, revision) {
      return pedir<ResultadoAuditoriaDto>(
        `/api/auditorias/${encodeURIComponent(auditoriaId)}/revision`,
        'POST',
        revision,
      );
    },
    obtenerInformeAgente(agenteId) {
      return pedir<InformeAgenteDto>(`/api/agentes/${encodeURIComponent(agenteId)}/informe`, 'GET');
    },
    compararAuditorias(auditoriaIdA, auditoriaIdB) {
      return pedir<ComparacionAuditoriasDto>(
        `/api/auditorias/${encodeURIComponent(auditoriaIdA)}/comparacion/${encodeURIComponent(auditoriaIdB)}`,
        'GET',
      );
    },
  };
}

/** Intenta leer `{ error }` del cuerpo; si no es JSON interpretable, devuelve un mensaje genérico. */
async function extraerMensajeError(respuesta: Response): Promise<string> {
  try {
    const cuerpo: unknown = await respuesta.json();
    if (typeof cuerpo === 'object' && cuerpo !== null && 'error' in cuerpo) {
      const error = (cuerpo as { error: unknown }).error;
      if (typeof error === 'string') return error;
    }
  } catch {
    // Cuerpo no-JSON (p. ej. una página de error de un proxy): caemos al mensaje genérico.
  }
  return `La API respondió con el estado ${respuesta.status}.`;
}
