import type { LlamadaDto } from '@/api/tipos';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatearFechaHora } from '@/lib/formato';

export interface ListaLlamadasProps {
  readonly llamadas: readonly LlamadaDto[];
  readonly onAuditar: (llamadaId: string) => void;
  /** Id de la llamada cuya auditoría está en curso (deshabilita su botón). */
  readonly llamadaEnCurso?: string | null;
  /** Si se proporciona, muestra un botón para consultar el historial de la llamada. */
  readonly onVerHistorial?: (llamadaId: string) => void;
  /** Si se proporciona, muestra un botón para ver el informe de desempeño del agente. */
  readonly onVerInforme?: (agenteId: string) => void;
}

/**
 * Vista presentacional de las llamadas pendientes de auditar. No conoce la API ni el
 * estado: recibe los datos y notifica la intención de auditar mediante `onAuditar`,
 * dejando la orquestación a su contenedor.
 */
export function ListaLlamadas({
  llamadas,
  onAuditar,
  llamadaEnCurso,
  onVerHistorial,
  onVerInforme,
}: ListaLlamadasProps): React.JSX.Element {
  if (llamadas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
        No hay llamadas pendientes de auditar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {llamadas.map((llamada) => {
        const enCurso = llamada.id === llamadaEnCurso;
        return (
          <li key={llamada.id}>
            <Card>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{llamada.agenteId}</span>
                  <span className="text-sm text-[var(--color-tenue)]">
                    {formatearFechaHora(llamada.fechaInicio)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tono="neutro">{llamada.numeroIntervenciones} intervenciones</Badge>
                  {onVerHistorial !== undefined && (
                    <Button
                      variante="contorno"
                      tamano="pequeno"
                      onClick={() => onVerHistorial(llamada.id)}
                    >
                      Historial
                    </Button>
                  )}
                  {onVerInforme !== undefined && (
                    <Button
                      variante="contorno"
                      tamano="pequeno"
                      onClick={() => onVerInforme(llamada.agenteId)}
                    >
                      Informe
                    </Button>
                  )}
                  <Button
                    tamano="pequeno"
                    disabled={enCurso}
                    onClick={() => onAuditar(llamada.id)}
                  >
                    {enCurso ? 'Auditando…' : 'Auditar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
