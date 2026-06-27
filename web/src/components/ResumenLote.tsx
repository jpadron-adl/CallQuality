import type { ResumenLoteDto } from '@/api/tipos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ResumenLoteProps {
  readonly resumen: ResumenLoteDto;
}

/**
 * Vista presentacional del resultado de auditar un lote: cuántas llamadas estaban
 * pendientes, cuántas se auditaron y cuántas fallaron, con el detalle de los fallos.
 * Recibe el DTO ya serializado por la API.
 */
export function ResumenLote({ resumen }: ResumenLoteProps): React.JSX.Element {
  if (resumen.totalPendientes === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
        No había llamadas pendientes de auditar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle>{resumen.totalPendientes} llamadas procesadas</CardTitle>
          <div className="flex items-center gap-2">
            <Badge tono="exito">{resumen.auditadas} auditadas</Badge>
            <Badge tono={resumen.fallidas > 0 ? 'peligro' : 'neutro'}>
              {resumen.fallidas} {resumen.fallidas === 1 ? 'fallida' : 'fallidas'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {resumen.fallos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fallos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {resumen.fallos.map((fallo) => (
                <li key={fallo.llamadaId} className="flex flex-col gap-0.5">
                  <span className="font-medium">{fallo.llamadaId}</span>
                  <span className="text-sm text-[var(--color-tenue)]">{fallo.motivo}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
