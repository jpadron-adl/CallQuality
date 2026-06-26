import { useState } from 'react';
import type { CorreccionEntradaDto, NuevaRevision, ResultadoAuditoriaDto } from '@/api/tipos';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface FormularioRevisionProps {
  readonly resultado: ResultadoAuditoriaDto;
  readonly onRevisar: (auditoriaId: string, revision: NuevaRevision) => void;
  /** Mientras es true, el formulario queda deshabilitado y muestra el progreso. */
  readonly revisando?: boolean;
}

/** Estado local de la corrección de un protocolo: si está activa, el nuevo veredicto y su evidencia. */
interface CorreccionLocal {
  readonly activa: boolean;
  readonly cumplido: boolean;
  readonly evidencia: string;
}

const claseCampo =
  'rounded-md border border-[var(--color-borde)] bg-[var(--color-superficie)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2';

/**
 * Formulario de revisión humana de una auditoría (human-in-the-loop). Permite identificar al
 * revisor, dejar un comentario y corregir el veredicto del LLM protocolo a protocolo (con su
 * justificación). Solo se envían como correcciones los protocolos cuya casilla se ha activado.
 * Vista presentacional con estado local: delega el alta real en `onRevisar`.
 */
export function FormularioRevision({
  resultado,
  onRevisar,
  revisando = false,
}: FormularioRevisionProps): React.JSX.Element {
  const [revisor, setRevisor] = useState('');
  const [comentario, setComentario] = useState('');
  const [correcciones, setCorrecciones] = useState<Record<string, CorreccionLocal>>(() =>
    Object.fromEntries(
      resultado.evaluaciones.map((evaluacion) => [
        evaluacion.protocolo,
        { activa: false, cumplido: !evaluacion.cumplido, evidencia: '' },
      ]),
    ),
  );

  const activas = resultado.evaluaciones
    .map((evaluacion) => ({ protocolo: evaluacion.protocolo, ...correcciones[evaluacion.protocolo]! }))
    .filter((correccion) => correccion.activa);

  const valido = revisor.trim() !== '' && activas.every((c) => c.evidencia.trim() !== '');

  function actualizar(protocolo: string, cambio: Partial<CorreccionLocal>): void {
    setCorrecciones((previas) => ({ ...previas, [protocolo]: { ...previas[protocolo]!, ...cambio } }));
  }

  function enviar(evento: React.FormEvent): void {
    evento.preventDefault();
    if (!valido || revisando) return;
    const correccionesEnviadas: CorreccionEntradaDto[] = activas.map((c) => ({
      protocolo: c.protocolo,
      cumplido: c.cumplido,
      evidencia: c.evidencia.trim(),
    }));
    onRevisar(resultado.id, {
      revisor: revisor.trim(),
      ...(comentario.trim() === '' ? {} : { comentario: comentario.trim() }),
      correcciones: correccionesEnviadas,
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form className="flex flex-col gap-4" aria-label="Revisar auditoría" onSubmit={enviar}>
          <div className="flex flex-col gap-1">
            <label htmlFor="revisor" className="text-sm font-medium">
              Tu identificador (revisor)
            </label>
            <input
              id="revisor"
              className={claseCampo}
              value={revisor}
              disabled={revisando}
              onChange={(e) => setRevisor(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="comentario" className="text-sm font-medium">
              Comentario (opcional)
            </label>
            <textarea
              id="comentario"
              className={claseCampo}
              rows={2}
              value={comentario}
              disabled={revisando}
              onChange={(e) => setComentario(e.target.value)}
            />
          </div>

          <ul className="flex flex-col gap-2">
            {resultado.evaluaciones.map((evaluacion) => {
              const correccion = correcciones[evaluacion.protocolo]!;
              return (
                <li
                  key={evaluacion.protocolo}
                  className="flex flex-col gap-2 rounded-md border border-[var(--color-borde)] p-3"
                >
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      aria-label={`Corregir ${evaluacion.protocolo}`}
                      checked={correccion.activa}
                      disabled={revisando}
                      onChange={(e) => actualizar(evaluacion.protocolo, { activa: e.target.checked })}
                    />
                    Corregir {evaluacion.protocolo}
                  </label>

                  {correccion.activa && (
                    <div className="flex flex-col gap-2 pl-6">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          aria-label={`Nuevo veredicto de ${evaluacion.protocolo}`}
                          checked={correccion.cumplido}
                          disabled={revisando}
                          onChange={(e) => actualizar(evaluacion.protocolo, { cumplido: e.target.checked })}
                        />
                        {correccion.cumplido ? 'Cumplido' : 'No cumplido'}
                      </label>
                      <textarea
                        className={claseCampo}
                        aria-label={`Evidencia de la corrección de ${evaluacion.protocolo}`}
                        rows={2}
                        value={correccion.evidencia}
                        disabled={revisando}
                        onChange={(e) => actualizar(evaluacion.protocolo, { evidencia: e.target.value })}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end">
            <Button type="submit" disabled={!valido || revisando}>
              {revisando ? 'Guardando…' : 'Guardar revisión'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
