import type { InformeAgenteDto } from '@/api/tipos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, type BadgeProps } from '@/components/ui/Badge';

export interface InformeAgenteProps {
  readonly informe: InformeAgenteDto;
}

/** Tono del badge de puntuación: verde si alta, ámbar si media, rojo si baja. */
function tonoPuntuacion(puntuacion: number): BadgeProps['tono'] {
  if (puntuacion >= 80) return 'exito';
  if (puntuacion >= 50) return 'aviso';
  return 'peligro';
}

/**
 * Vista presentacional del informe de desempeño de un agente: puntuación media, ranking de
 * protocolos más incumplidos y alertas por severidad. Recibe el DTO ya serializado por la API.
 */
export function InformeAgente({ informe }: InformeAgenteProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <CardTitle>{informe.agenteId}</CardTitle>
            <span className="text-xs text-[var(--color-tenue)]">
              {informe.numeroLlamadasAuditadas} llamadas auditadas
            </span>
          </div>
          <Badge tono={tonoPuntuacion(informe.puntuacionMedia)} className="text-sm">
            {informe.puntuacionMedia} / 100
          </Badge>
        </CardHeader>
      </Card>

      {informe.numeroLlamadasAuditadas === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
          Sin llamadas auditadas para este agente.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Protocolos más incumplidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {informe.protocolosMasIncumplidos.map((protocolo) => (
                  <li key={protocolo.protocolo} className="flex items-center justify-between gap-3">
                    <span className="font-medium">{protocolo.protocolo}</span>
                    <Badge tono={protocolo.incumplimientos > 0 ? 'peligro' : 'exito'}>
                      {protocolo.incumplimientos} de {protocolo.evaluaciones}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent>
              {informe.totalAlertas === 0 ? (
                <p className="text-sm text-[var(--color-tenue)]">Sin alertas de cumplimiento.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {informe.alertasPorSeveridad.map((alerta) => (
                    <li key={alerta.severidad} className="flex items-center justify-between gap-3">
                      <span className="font-medium">{alerta.severidad}</span>
                      <Badge tono="neutro">{alerta.total}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
