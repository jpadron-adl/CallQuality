import { useCallback, useEffect, useState } from 'react';
import { crearClienteAuditoria, type ClienteAuditoria } from '@/api/auditoriaApi';
import { ApiError } from '@/api/ApiError';
import type { LlamadaDto, ResultadoAuditoriaDto } from '@/api/tipos';
import { ListaLlamadas } from '@/components/ListaLlamadas';
import { DetalleAuditoria } from '@/components/DetalleAuditoria';

export interface AppProps {
  /** Cliente de la API; inyectable para pruebas. Por defecto, el cliente real. */
  readonly cliente?: ClienteAuditoria;
}

/** Traduce cualquier fallo en un mensaje legible para el profesor. */
function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'No se ha podido contactar con la API de auditoría.';
}

/**
 * Raíz del dashboard del profesor. Orquesta el cliente de la API y el estado de la
 * interfaz (maestro-detalle): lista las llamadas pendientes y, al auditar una, muestra
 * su resultado. La lógica de presentación vive en los componentes; aquí solo el estado.
 */
export function App({ cliente }: AppProps): React.JSX.Element {
  const [api] = useState<ClienteAuditoria>(() => cliente ?? crearClienteAuditoria());
  const [llamadas, setLlamadas] = useState<readonly LlamadaDto[]>([]);
  const [resultado, setResultado] = useState<ResultadoAuditoriaDto | null>(null);
  const [llamadaEnCurso, setLlamadaEnCurso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    api
      .listarLlamadas()
      .then((datos) => {
        if (activo) setLlamadas(datos);
      })
      .catch((err: unknown) => {
        if (activo) setError(mensajeDeError(err));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [api]);

  const auditar = useCallback(
    (llamadaId: string): void => {
      setLlamadaEnCurso(llamadaId);
      setError(null);
      api
        .auditarLlamada(llamadaId)
        .then((nuevoResultado) => setResultado(nuevoResultado))
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setLlamadaEnCurso(null));
    },
    [api],
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">CallQuality · Panel de Auditoría</h1>
        <p className="text-sm text-[var(--color-tenue)]">
          Audita las llamadas pendientes y revisa el cumplimiento de los protocolos de calidad.
        </p>
      </header>

      {error !== null && (
        <p
          role="alert"
          className="rounded-md border border-[var(--color-peligro)]/40 bg-[var(--color-peligro)]/10 px-4 py-3 text-sm text-[var(--color-peligro)]"
        >
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3" aria-label="Llamadas pendientes">
          <h2 className="text-lg font-medium">Llamadas pendientes</h2>
          {cargando ? (
            <p className="text-sm text-[var(--color-tenue)]">Cargando llamadas…</p>
          ) : (
            <ListaLlamadas llamadas={llamadas} onAuditar={auditar} llamadaEnCurso={llamadaEnCurso} />
          )}
        </section>

        <section className="flex flex-col gap-3" aria-label="Resultado de la auditoría">
          <h2 className="text-lg font-medium">Resultado de la auditoría</h2>
          {resultado === null ? (
            <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
              Selecciona una llamada y pulsa «Auditar» para ver su análisis.
            </p>
          ) : (
            <DetalleAuditoria resultado={resultado} />
          )}
        </section>
      </div>
    </main>
  );
}
