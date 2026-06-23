import type { ResultadoAuditoriaDto } from '@/api/tipos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { formatearFechaHora } from '@/lib/formato';

export interface DetalleAuditoriaProps {
  readonly resultado: ResultadoAuditoriaDto;
}

/** Tono del badge de severidad según la gravedad de la alerta. */
function tonoSeveridad(severidad: string): BadgeProps['tono'] {
  switch (severidad.toUpperCase()) {
    case 'CRITICA':
    case 'ALTA':
      return 'peligro';
    case 'MEDIA':
      return 'aviso';
    default:
      return 'neutro';
  }
}

/** Tono del badge de puntuación: verde si alta, ámbar si media, rojo si baja. */
function tonoPuntuacion(puntuacion: number): BadgeProps['tono'] {
  if (puntuacion >= 80) return 'exito';
  if (puntuacion >= 50) return 'aviso';
  return 'peligro';
}

/**
 * Vista presentacional del resultado de una auditoría: puntuación de calidad,
 * cumplimiento protocolo a protocolo con su evidencia, y alertas de cumplimiento.
 * Recibe el DTO ya serializado por la API; no contiene lógica de negocio.
 */
export function DetalleAuditoria({ resultado }: DetalleAuditoriaProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CardTitle>Puntuación de calidad</CardTitle>
            <span className="text-xs text-[var(--color-tenue)]">
              Auditoría realizada el {formatearFechaHora(resultado.fechaAuditoria)}
            </span>
          </div>
          <Badge tono={tonoPuntuacion(resultado.puntuacion)} className="text-sm">
            {resultado.puntuacion} / 100
          </Badge>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento de protocolos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {resultado.evaluaciones.map((evaluacion) => (
              <li key={evaluacion.protocolo} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{evaluacion.protocolo}</span>
                  <Badge tono={evaluacion.cumplido ? 'exito' : 'peligro'}>
                    {evaluacion.cumplido ? 'Cumplido' : 'No cumplido'}
                  </Badge>
                </div>
                <p className="text-sm text-[var(--color-tenue)]">{evaluacion.evidencia}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de cumplimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <section aria-label="Alertas de cumplimiento">
            {resultado.alertas.length === 0 ? (
              <p className="text-sm text-[var(--color-tenue)]">Sin alertas de cumplimiento.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {resultado.alertas.map((alerta, indice) => (
                  <li key={`${alerta.tipo}-${indice}`} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{alerta.tipo}</span>
                      <Badge tono={tonoSeveridad(alerta.severidad)}>{alerta.severidad}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-tenue)]">{alerta.evidencia}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
