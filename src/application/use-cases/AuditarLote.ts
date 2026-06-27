import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { Llamada } from '@domain/llamada/Llamada';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { AuditarLlamada } from '@application/use-cases/AuditarLlamada';

/** Llamada del lote cuya auditoría no pudo completarse, con el motivo del fallo. */
export interface FalloAuditoriaLote {
  readonly llamadaId: string;
  readonly motivo: string;
}

/**
 * Resumen del resultado de auditar un lote: cuántas llamadas estaban pendientes, cuántas
 * se auditaron, cuántas fallaron, las auditorías producidas y el detalle de los fallos.
 */
export interface ResumenLote {
  readonly totalPendientes: number;
  readonly auditadas: number;
  readonly fallidas: number;
  readonly resultados: ResultadoAuditoria[];
  readonly fallos: FalloAuditoriaLote[];
}

/**
 * Caso de uso (comando): audita en una sola operación todas las llamadas que aún no tienen
 * ninguna auditoría. Determina las pendientes orquestando ambos repositorios (sin acoplarlos)
 * y delega cada auditoría individual en `AuditarLlamada`, reutilizando su lógica. Es resiliente:
 * el fallo de una llamada no detiene el lote; se registra y se continúa con las demás.
 */
export class AuditarLote {
  constructor(
    private readonly llamadas: LlamadaRepository,
    private readonly auditorias: AuditoriaRepository,
    private readonly auditarLlamada: AuditarLlamada,
  ) {}

  async ejecutar(): Promise<ResumenLote> {
    const pendientes = await this.pendientesDeAuditar();

    const resultados: ResultadoAuditoria[] = [];
    const fallos: FalloAuditoriaLote[] = [];
    for (const llamada of pendientes) {
      try {
        resultados.push(await this.auditarLlamada.ejecutar(llamada.id));
      } catch (error) {
        fallos.push({ llamadaId: llamada.id.valor, motivo: motivoDe(error) });
      }
    }

    return {
      totalPendientes: pendientes.length,
      auditadas: resultados.length,
      fallidas: fallos.length,
      resultados,
      fallos,
    };
  }

  /** Llamadas conocidas que aún no tienen ninguna auditoría registrada. */
  private async pendientesDeAuditar(): Promise<Llamada[]> {
    const llamadas = await this.llamadas.listarPendientesDeAuditar();
    const pendientes: Llamada[] = [];
    for (const llamada of llamadas) {
      const previas = await this.auditorias.obtenerPorLlamada(llamada.id);
      if (previas.length === 0) {
        pendientes.push(llamada);
      }
    }
    return pendientes;
  }
}

/** Extrae un mensaje legible de un error desconocido. */
function motivoDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido al auditar la llamada.';
}
