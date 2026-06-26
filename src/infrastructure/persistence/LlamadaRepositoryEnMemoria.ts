import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { Llamada } from '@domain/llamada/Llamada';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Adaptador de persistencia en memoria para el Modo Demo.
 * Implementa el puerto LlamadaRepository sin dependencias externas.
 */
export class LlamadaRepositoryEnMemoria implements LlamadaRepository {
  private readonly llamadas = new Map<string, Llamada>();

  constructor(iniciales: readonly Llamada[] = []) {
    for (const llamada of iniciales) {
      this.llamadas.set(llamada.id.valor, llamada);
    }
  }

  async obtenerPorId(id: LlamadaId): Promise<Llamada | null> {
    return this.llamadas.get(id.valor) ?? null;
  }

  async guardar(llamada: Llamada): Promise<void> {
    this.llamadas.set(llamada.id.valor, llamada);
  }

  async listarPendientesDeAuditar(): Promise<Llamada[]> {
    return [...this.llamadas.values()];
  }

  async listarPorAgente(agenteId: string): Promise<Llamada[]> {
    return [...this.llamadas.values()].filter((llamada) => llamada.agenteId === agenteId);
  }
}
