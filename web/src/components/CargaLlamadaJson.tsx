import { useState } from 'react';
import type { NuevaLlamada } from '@/api/tipos';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface CargaLlamadaJsonProps {
  readonly onRegistrar: (nueva: NuevaLlamada) => void;
  /** Mientras es true, el control queda deshabilitado y el botón muestra el progreso. */
  readonly registrando?: boolean;
}

/**
 * Interpreta el contenido ya parseado de un fichero y lo valida contra la forma esperada
 * (la misma de `llamadas-demo.json` y del contrato de alta). Devuelve una `NuevaLlamada`
 * normalizada u lanza un `Error` con un mensaje legible para el profesor. Un `id` u otras
 * claves presentes en el fichero se ignoran (el identificador lo genera el sistema).
 */
export function interpretarLlamada(datos: unknown): NuevaLlamada {
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) {
    throw new Error('El fichero debe contener un único objeto JSON con la llamada.');
  }
  const objeto = datos as Record<string, unknown>;

  const agenteId = typeof objeto.agenteId === 'string' ? objeto.agenteId.trim() : '';
  if (agenteId === '') {
    throw new Error('Falta el identificador del agente (agenteId).');
  }

  if (!Array.isArray(objeto.transcripcion) || objeto.transcripcion.length === 0) {
    throw new Error('La transcripción debe incluir al menos una intervención.');
  }

  const transcripcion = objeto.transcripcion.map((turno, indice) => {
    if (typeof turno !== 'object' || turno === null) {
      throw new Error(`La intervención ${indice + 1} no tiene la forma esperada.`);
    }
    const { rol, texto } = turno as Record<string, unknown>;
    if (typeof rol !== 'string' || rol.trim() === '' || typeof texto !== 'string' || texto.trim() === '') {
      throw new Error(`La intervención ${indice + 1} debe tener un rol y un texto no vacíos.`);
    }
    return { rol: rol.trim(), texto: texto.trim() };
  });

  if (objeto.fechaInicio !== undefined && typeof objeto.fechaInicio !== 'string') {
    throw new Error('La fecha de inicio (fechaInicio) debe ser una cadena en formato ISO 8601.');
  }

  const base: NuevaLlamada = { agenteId, transcripcion };
  return typeof objeto.fechaInicio === 'string'
    ? { ...base, fechaInicio: objeto.fechaInicio }
    : base;
}

/** Lee un fichero como texto. Usa FileReader (disponible en el navegador y en jsdom). */
function leerTexto(archivo: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(typeof lector.result === 'string' ? lector.result : '');
    lector.onerror = () => rechazar(new Error('No se ha podido leer el fichero.'));
    lector.readAsText(archivo);
  });
}

const claseBloque =
  'rounded-md border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-sm';

/**
 * Alta de una llamada subiendo un fichero JSON con la conversación completa (mismo formato
 * que los ejemplos de `ejemplos/llamadas/`). Vista presentacional: lee y valida el fichero
 * en el cliente, muestra un resumen o el error, y delega el alta real (API y recarga) en su
 * contenedor mediante `onRegistrar`.
 */
export function CargaLlamadaJson({
  onRegistrar,
  registrando = false,
}: CargaLlamadaJsonProps): React.JSX.Element {
  const [llamada, setLlamada] = useState<NuevaLlamada | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alSeleccionar(evento: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const archivo = evento.target.files?.[0];
    if (archivo === undefined) return;
    setNombreArchivo(archivo.name);

    try {
      const texto = await leerTexto(archivo);
      let datos: unknown;
      try {
        datos = JSON.parse(texto);
      } catch {
        throw new Error('El fichero no es un JSON válido.');
      }
      setLlamada(interpretarLlamada(datos));
      setError(null);
    } catch (fallo) {
      setLlamada(null);
      setError(fallo instanceof Error ? fallo.message : 'No se ha podido leer el fichero.');
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="ficheroLlamada" className="text-sm font-medium">
            Fichero de la llamada (JSON)
          </label>
          <input
            id="ficheroLlamada"
            type="file"
            accept="application/json,.json"
            className={`${claseBloque} file:mr-3 file:rounded file:border-0 file:bg-[var(--color-acento)] file:px-3 file:py-1 file:text-sm`}
            disabled={registrando}
            onChange={(e) => void alSeleccionar(e)}
          />
          <p className="text-xs text-[var(--color-tenue)]">
            Sube un fichero con el formato {'{ agenteId, fechaInicio?, transcripcion: [{ rol, texto }] }'}. Tienes
            ejemplos en la carpeta <code>ejemplos/llamadas/</code>.
          </p>
        </div>

        {error !== null && (
          <p
            role="alert"
            className="rounded-md border border-[var(--color-peligro)]/40 bg-[var(--color-peligro)]/10 px-3 py-2 text-sm text-[var(--color-peligro)]"
          >
            {error}
          </p>
        )}

        {llamada !== null && (
          <p className={claseBloque}>
            <span className="font-medium">{llamada.agenteId}</span> · {llamada.transcripcion.length}{' '}
            {llamada.transcripcion.length === 1 ? 'intervención' : 'intervenciones'}
            {nombreArchivo !== null && (
              <span className="text-[var(--color-tenue)]"> · {nombreArchivo}</span>
            )}
          </p>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={llamada === null || registrando}
            onClick={() => {
              if (llamada !== null && !registrando) onRegistrar(llamada);
            }}
          >
            {registrando ? 'Registrando…' : 'Registrar llamada'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
