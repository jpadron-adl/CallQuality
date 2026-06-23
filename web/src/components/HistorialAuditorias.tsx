import { useState } from 'react';
import type { ResultadoAuditoriaDto } from '@/api/tipos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DetalleAuditoria } from '@/components/DetalleAuditoria';

export interface HistorialAuditoriasProps {
  /** Auditorías de la llamada en orden de creación (la primera es la más antigua). */
  readonly auditorias: readonly ResultadoAuditoriaDto[];
}

/** Tono del badge de puntuación: verde si alta, ámbar si media, rojo si baja. */
function tonoPuntuacion(puntuacion: number): 'exito' | 'aviso' | 'peligro' {
  if (puntuacion >= 80) return 'exito';
  if (puntuacion >= 50) return 'aviso';
  return 'peligro';
}

/**
 * Vista presentacional del historial de auditorías de una llamada. Lista cada auditoría
 * con un resumen (puntuación y presencia de alertas) y permite desplegar su detalle
 * completo de forma independiente. Numera las entradas por orden de creación, ya que el
 * DTO no expone una fecha de auditoría.
 */
export function HistorialAuditorias({ auditorias }: HistorialAuditoriasProps): React.JSX.Element {
  const [expandidas, setExpandidas] = useState<ReadonlySet<string>>(new Set());

  if (auditorias.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-borde)] p-8 text-center text-[var(--color-tenue)]">
        Esta llamada aún no tiene auditorías registradas.
      </p>
    );
  }

  const alternar = (id: string): void => {
    setExpandidas((previas) => {
      const siguiente = new Set(previas);
      if (siguiente.has(id)) {
        siguiente.delete(id);
      } else {
        siguiente.add(id);
      }
      return siguiente;
    });
  };

  return (
    <ul className="flex flex-col gap-3">
      {auditorias.map((auditoria, indice) => {
        const expandida = expandidas.has(auditoria.id);
        return (
          <li key={auditoria.id}>
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle>Auditoría {indice + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge tono={tonoPuntuacion(auditoria.puntuacion)}>{auditoria.puntuacion} / 100</Badge>
                  <Badge tono={auditoria.tieneAlertas ? 'peligro' : 'neutro'}>
                    {auditoria.tieneAlertas ? 'Con alertas' : 'Sin alertas'}
                  </Badge>
                  <Button variante="contorno" tamano="pequeno" onClick={() => alternar(auditoria.id)}>
                    {expandida ? 'Ocultar detalle' : 'Ver detalle'}
                  </Button>
                </div>
              </CardHeader>
              {expandida && (
                <CardContent>
                  <DetalleAuditoria resultado={auditoria} />
                </CardContent>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
