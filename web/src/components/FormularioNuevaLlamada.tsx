import { useState } from 'react';
import type { NuevaLlamada } from '@/api/tipos';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/** Roles admitidos, espejo del catálogo IntervinienteRol del dominio. */
const ROLES = ['AGENTE', 'CLIENTE', 'SISTEMA'] as const;

interface FilaIntervencion {
  readonly rol: string;
  readonly texto: string;
}

export interface FormularioNuevaLlamadaProps {
  readonly onRegistrar: (nueva: NuevaLlamada) => void;
  /** Mientras es true, el formulario queda deshabilitado y muestra el progreso. */
  readonly registrando?: boolean;
}

const FILA_INICIAL: FilaIntervencion = { rol: 'AGENTE', texto: '' };

const claseCampo =
  'rounded-md border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2';

/**
 * Formulario de alta de una llamada a partir de su transcripción textual. Vista
 * presentacional con estado local de edición: gestiona el agente y una lista dinámica
 * de intervenciones (rol + texto) y notifica el alta mediante `onRegistrar`, dejando la
 * orquestación (llamada a la API, recarga) a su contenedor.
 */
export function FormularioNuevaLlamada({
  onRegistrar,
  registrando = false,
}: FormularioNuevaLlamadaProps): React.JSX.Element {
  const [agenteId, setAgenteId] = useState('');
  const [intervenciones, setIntervenciones] = useState<FilaIntervencion[]>([FILA_INICIAL]);

  const valido =
    agenteId.trim() !== '' &&
    intervenciones.length > 0 &&
    intervenciones.every((fila) => fila.texto.trim() !== '');

  function actualizarFila(indice: number, cambio: Partial<FilaIntervencion>): void {
    setIntervenciones((filas) => filas.map((fila, i) => (i === indice ? { ...fila, ...cambio } : fila)));
  }

  function anadirFila(): void {
    setIntervenciones((filas) => [...filas, { rol: 'AGENTE', texto: '' }]);
  }

  function quitarFila(indice: number): void {
    setIntervenciones((filas) => filas.filter((_, i) => i !== indice));
  }

  function enviar(evento: React.FormEvent): void {
    evento.preventDefault();
    if (!valido || registrando) return;
    onRegistrar({
      agenteId: agenteId.trim(),
      intervenciones: intervenciones.map((fila) => ({ rol: fila.rol, texto: fila.texto.trim() })),
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form className="flex flex-col gap-4" aria-label="Nueva llamada" onSubmit={enviar}>
          <div className="flex flex-col gap-1">
            <label htmlFor="agenteId" className="text-sm font-medium">
              Identificador del agente
            </label>
            <input
              id="agenteId"
              className={claseCampo}
              value={agenteId}
              disabled={registrando}
              onChange={(e) => setAgenteId(e.target.value)}
            />
          </div>

          <ul className="flex flex-col gap-3">
            {intervenciones.map((fila, indice) => {
              const numero = indice + 1;
              return (
                <li key={indice} className="flex flex-col gap-2 rounded-md border border-[var(--color-borde)] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`rol-${indice}`} className="text-sm font-medium">
                      Intervención {numero}
                    </label>
                    {intervenciones.length > 1 && (
                      <Button
                        type="button"
                        variante="contorno"
                        tamano="pequeno"
                        disabled={registrando}
                        aria-label={`Quitar intervención ${numero}`}
                        onClick={() => quitarFila(indice)}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                  <select
                    id={`rol-${indice}`}
                    className={claseCampo}
                    aria-label={`Rol de la intervención ${numero}`}
                    value={fila.rol}
                    disabled={registrando}
                    onChange={(e) => actualizarFila(indice, { rol: e.target.value })}
                  >
                    {ROLES.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={claseCampo}
                    aria-label={`Texto de la intervención ${numero}`}
                    rows={2}
                    value={fila.texto}
                    disabled={registrando}
                    onChange={(e) => actualizarFila(indice, { texto: e.target.value })}
                  />
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variante="contorno" tamano="pequeno" disabled={registrando} onClick={anadirFila}>
              Añadir intervención
            </Button>
            <Button type="submit" disabled={!valido || registrando}>
              {registrando ? 'Registrando…' : 'Registrar llamada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
