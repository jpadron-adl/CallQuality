import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { InformeAgente } from '@domain/auditoria/InformeAgente';

/**
 * Caso de uso (consulta): genera el informe de desempeño de un agente. Recopila las
 * auditorías de todas sus llamadas y delega en el dominio el cálculo del informe. Es una
 * operación de solo lectura: no modifica el estado del sistema.
 */
export class GenerarInformeAgente {
  constructor(
    private readonly llamadas: LlamadaRepository,
    private readonly auditorias: AuditoriaRepository,
  ) {}

  async ejecutar(agenteId: string): Promise<InformeAgente> {
    const llamadasDelAgente = await this.llamadas.listarPorAgente(agenteId);
    const auditoriasPorLlamada = await Promise.all(
      llamadasDelAgente.map((llamada) => this.auditorias.obtenerPorLlamada(llamada.id)),
    );
    return InformeAgente.generar(agenteId, auditoriasPorLlamada.flat());
  }
}
