import { useCallback, useEffect, useState } from 'react';
import { crearClienteAuditoria, type ClienteAuditoria } from '@/api/auditoriaApi';
import { ApiError } from '@/api/ApiError';
import type { LlamadaDto, NuevaLlamada, NuevaRevision, ResultadoAuditoriaDto } from '@/api/tipos';
import { ListaLlamadas } from '@/components/ListaLlamadas';
import { DetalleAuditoria } from '@/components/DetalleAuditoria';
import { HistorialAuditorias } from '@/components/HistorialAuditorias';
import { InformeAgente } from '@/components/InformeAgente';
import { ComparacionAuditorias } from '@/components/ComparacionAuditorias';
import { CargaLlamadaJson } from '@/components/CargaLlamadaJson';
import type { ComparacionAuditoriasDto, InformeAgenteDto } from '@/api/tipos';

export interface AppProps {
  /** Cliente de la API; inyectable para pruebas. Por defecto, el cliente real. */
  readonly cliente?: ClienteAuditoria;
}

/** Estado del panel de detalle (derecha): vacío, un resultado puntual o el historial. */
type PanelDerecho =
  | { readonly tipo: 'vacio' }
  | { readonly tipo: 'cargando-historial' }
  | { readonly tipo: 'cargando-informe' }
  | { readonly tipo: 'cargando-comparacion' }
  | { readonly tipo: 'resultado'; readonly resultado: ResultadoAuditoriaDto }
  | {
      readonly tipo: 'historial';
      readonly llamadaId: string;
      readonly auditorias: readonly ResultadoAuditoriaDto[];
    }
  | { readonly tipo: 'informe'; readonly informe: InformeAgenteDto }
  | { readonly tipo: 'comparacion'; readonly comparacion: ComparacionAuditoriasDto };

/** Título de la sección de detalle según el tipo de panel mostrado. */
function tituloPanel(tipo: PanelDerecho['tipo']): string {
  if (tipo === 'historial' || tipo === 'cargando-historial') return 'Historial de auditorías';
  if (tipo === 'informe' || tipo === 'cargando-informe') return 'Informe del agente';
  if (tipo === 'comparacion' || tipo === 'cargando-comparacion') return 'Comparación de auditorías';
  return 'Resultado de la auditoría';
}

/** Traduce cualquier fallo en un mensaje legible para el profesor. */
function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'No se ha podido contactar con la API de auditoría.';
}

interface AccionesPanel {
  readonly onReauditar: (llamadaId: string) => void;
  readonly reauditando: boolean;
  readonly onRevisar: (auditoriaId: string, revision: NuevaRevision) => void;
  readonly revisando: boolean;
  readonly onComparar: (auditoriaIdA: string, auditoriaIdB: string) => void;
  readonly comparando: boolean;
}

/** Renderiza el contenido del panel de detalle según su estado. */
function renderizarPanel(panel: PanelDerecho, acciones: AccionesPanel): React.JSX.Element {
  switch (panel.tipo) {
    case 'cargando-historial':
      return <p className="text-sm text-[var(--color-tenue)]">Cargando historial…</p>;
    case 'cargando-informe':
      return <p className="text-sm text-[var(--color-tenue)]">Cargando informe…</p>;
    case 'cargando-comparacion':
      return <p className="text-sm text-[var(--color-tenue)]">Cargando comparación…</p>;
    case 'informe':
      return <InformeAgente informe={panel.informe} />;
    case 'comparacion':
      return <ComparacionAuditorias comparacion={panel.comparacion} />;
    case 'resultado':
      return <DetalleAuditoria resultado={panel.resultado} />;
    case 'historial':
      return (
        <HistorialAuditorias
          auditorias={panel.auditorias}
          llamadaId={panel.llamadaId}
          onReauditar={acciones.onReauditar}
          reauditando={acciones.reauditando}
          onRevisar={acciones.onRevisar}
          revisando={acciones.revisando}
          onComparar={acciones.onComparar}
          comparando={acciones.comparando}
        />
      );
    case 'vacio':
      return (
        <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
          Selecciona una llamada y pulsa «Auditar» para analizarla, o «Historial» para ver sus auditorías previas.
        </p>
      );
  }
}

/**
 * Raíz del dashboard del profesor. Orquesta el cliente de la API y el estado de la
 * interfaz (maestro-detalle): lista las llamadas pendientes y, al auditar una, muestra
 * su resultado. La lógica de presentación vive en los componentes; aquí solo el estado.
 */
export function App({ cliente }: AppProps): React.JSX.Element {
  const [api] = useState<ClienteAuditoria>(() => cliente ?? crearClienteAuditoria());
  const [llamadas, setLlamadas] = useState<readonly LlamadaDto[]>([]);
  const [panel, setPanel] = useState<PanelDerecho>({ tipo: 'vacio' });
  const [llamadaEnCurso, setLlamadaEnCurso] = useState<string | null>(null);
  const [reauditando, setReauditando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [comparando, setComparando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargarLlamadas = useCallback((): Promise<void> => {
    setCargando(true);
    return api
      .listarLlamadas()
      .then((datos) => setLlamadas(datos))
      .catch((err: unknown) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, [api]);

  useEffect(() => {
    void recargarLlamadas();
  }, [recargarLlamadas]);

  const auditar = useCallback(
    (llamadaId: string): void => {
      setLlamadaEnCurso(llamadaId);
      setError(null);
      api
        .auditarLlamada(llamadaId)
        .then((nuevoResultado) => setPanel({ tipo: 'resultado', resultado: nuevoResultado }))
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setLlamadaEnCurso(null));
    },
    [api],
  );

  const registrar = useCallback(
    (nueva: NuevaLlamada): void => {
      setRegistrando(true);
      setError(null);
      api
        .registrarLlamada(nueva)
        .then(() => recargarLlamadas())
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setRegistrando(false));
    },
    [api, recargarLlamadas],
  );

  const verHistorial = useCallback(
    (llamadaId: string): void => {
      setError(null);
      setPanel({ tipo: 'cargando-historial' });
      api
        .listarAuditorias(llamadaId)
        .then((auditorias) => setPanel({ tipo: 'historial', llamadaId, auditorias }))
        .catch((err: unknown) => setError(mensajeDeError(err)));
    },
    [api],
  );

  const revisar = useCallback(
    (auditoriaId: string, nueva: NuevaRevision): void => {
      if (panel.tipo !== 'historial') return;
      const { llamadaId } = panel;
      setRevisando(true);
      setError(null);
      api
        .revisarAuditoria(auditoriaId, nueva)
        .then(() => api.listarAuditorias(llamadaId))
        .then((auditorias) => setPanel({ tipo: 'historial', llamadaId, auditorias }))
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setRevisando(false));
    },
    [api, panel],
  );

  const verInforme = useCallback(
    (agenteId: string): void => {
      setError(null);
      setPanel({ tipo: 'cargando-informe' });
      api
        .obtenerInformeAgente(agenteId)
        .then((informe) => setPanel({ tipo: 'informe', informe }))
        .catch((err: unknown) => setError(mensajeDeError(err)));
    },
    [api],
  );

  const comparar = useCallback(
    (auditoriaIdA: string, auditoriaIdB: string): void => {
      setComparando(true);
      setError(null);
      api
        .compararAuditorias(auditoriaIdA, auditoriaIdB)
        .then((comparacion) => setPanel({ tipo: 'comparacion', comparacion }))
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setComparando(false));
    },
    [api],
  );

  const reauditar = useCallback(
    (llamadaId: string): void => {
      setReauditando(true);
      setError(null);
      api
        .auditarLlamada(llamadaId)
        .then(() => api.listarAuditorias(llamadaId))
        .then((auditorias) => setPanel({ tipo: 'historial', llamadaId, auditorias }))
        .catch((err: unknown) => setError(mensajeDeError(err)))
        .finally(() => setReauditando(false));
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

      <section className="flex flex-col gap-3" aria-label="Registrar nueva llamada">
        <h2 className="text-lg font-medium">Registrar nueva llamada</h2>
        <CargaLlamadaJson onRegistrar={registrar} registrando={registrando} />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3" aria-label="Llamadas pendientes">
          <h2 className="text-lg font-medium">Llamadas pendientes</h2>
          {cargando ? (
            <p className="text-sm text-[var(--color-tenue)]">Cargando llamadas…</p>
          ) : (
            <ListaLlamadas
              llamadas={llamadas}
              onAuditar={auditar}
              llamadaEnCurso={llamadaEnCurso}
              onVerHistorial={verHistorial}
              onVerInforme={verInforme}
            />
          )}
        </section>

        <section className="flex flex-col gap-3" aria-label={tituloPanel(panel.tipo)}>
          <h2 className="text-lg font-medium">{tituloPanel(panel.tipo)}</h2>
          {renderizarPanel(panel, {
            onReauditar: reauditar,
            reauditando,
            onRevisar: revisar,
            revisando,
            onComparar: comparar,
            comparando,
          })}
        </section>
      </div>
    </main>
  );
}
