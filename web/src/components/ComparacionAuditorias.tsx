import type { ComparacionAuditoriasDto } from '@/api/tipos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, type BadgeProps } from '@/components/ui/Badge';

export interface ComparacionAuditoriasProps {
  readonly comparacion: ComparacionAuditoriasDto;
}

/** Tono del badge de puntuación: verde si alta, ámbar si media, rojo si baja. */
function tonoPuntuacion(puntuacion: number): BadgeProps['tono'] {
  if (puntuacion >= 80) return 'exito';
  if (puntuacion >= 50) return 'aviso';
  return 'peligro';
}

/** Diferencia con signo explícito (p. ej. "+50", "-30", "0"). */
function diferenciaConSigno(diferencia: number): string {
  return diferencia > 0 ? `+${diferencia}` : `${diferencia}`;
}

/** Tono del delta: verde si mejora, rojo si empeora, neutro si no varía. */
function tonoDiferencia(diferencia: number): BadgeProps['tono'] {
  if (diferencia > 0) return 'exito';
  if (diferencia < 0) return 'peligro';
  return 'neutro';
}

/** Etiqueta legible del veredicto efectivo de un protocolo. */
function etiquetaVeredicto(cumplido: boolean | null): string {
  if (cumplido === null) return 'No evaluado';
  return cumplido ? 'Cumplido' : 'Incumplido';
}

/**
 * Vista presentacional de la comparación entre dos auditorías de una misma llamada:
 * el delta de puntuación, los protocolos cuyo veredicto cambió y las alertas que
 * aparecieron o desaparecieron. Recibe el DTO ya serializado por la API.
 */
export function ComparacionAuditorias({
  comparacion,
}: ComparacionAuditoriasProps): React.JSX.Element {
  const sinCambios =
    comparacion.protocolosCambiados.length === 0 &&
    comparacion.alertasAparecidas.length === 0 &&
    comparacion.alertasDesaparecidas.length === 0 &&
    comparacion.diferenciaPuntuacion === 0;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge tono={tonoPuntuacion(comparacion.puntuacionA)}>
              {comparacion.puntuacionA} / 100
            </Badge>
            <span className="text-[var(--color-tenue)]" aria-hidden="true">
              →
            </span>
            <Badge tono={tonoPuntuacion(comparacion.puntuacionB)}>
              {comparacion.puntuacionB} / 100
            </Badge>
          </div>
          <Badge tono={tonoDiferencia(comparacion.diferenciaPuntuacion)} className="text-sm">
            {diferenciaConSigno(comparacion.diferenciaPuntuacion)}
          </Badge>
        </CardHeader>
      </Card>

      {sinCambios ? (
        <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
          Sin diferencias entre las dos auditorías.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Protocolos con veredicto cambiado</CardTitle>
            </CardHeader>
            <CardContent>
              {comparacion.protocolosCambiados.length === 0 ? (
                <p className="text-sm text-[var(--color-tenue)]">
                  Ningún protocolo cambió de veredicto.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {comparacion.protocolosCambiados.map((protocolo) => (
                    <li
                      key={protocolo.protocolo}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="font-medium">{protocolo.protocolo}</span>
                      <span className="text-sm text-[var(--color-tenue)]">
                        {etiquetaVeredicto(protocolo.cumplidoA)} →{' '}
                        {etiquetaVeredicto(protocolo.cumplidoB)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase text-[var(--color-tenue)]">
                  Aparecidas
                </span>
                {comparacion.alertasAparecidas.length === 0 ? (
                  <p className="text-sm text-[var(--color-tenue)]">Ninguna.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {comparacion.alertasAparecidas.map((alerta) => (
                      <li key={alerta.tipo} className="flex items-center justify-between gap-3">
                        <span className="font-medium">{alerta.tipo}</span>
                        <Badge tono="peligro">{alerta.severidad}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium uppercase text-[var(--color-tenue)]">
                  Desaparecidas
                </span>
                {comparacion.alertasDesaparecidas.length === 0 ? (
                  <p className="text-sm text-[var(--color-tenue)]">Ninguna.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {comparacion.alertasDesaparecidas.map((alerta) => (
                      <li key={alerta.tipo} className="flex items-center justify-between gap-3">
                        <span className="font-medium">{alerta.tipo}</span>
                        <Badge tono="neutro">{alerta.severidad}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
