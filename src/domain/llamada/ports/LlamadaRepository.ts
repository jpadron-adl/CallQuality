import type { Llamada } from '@domain/llamada/Llamada';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Puerto de persistencia del agregado Llamada.
 * Pertenece al dominio; la infraestructura proveerá los adaptadores concretos
 * (inversión de dependencias). El dominio nunca conoce la tecnología subyacente.
 */
export interface LlamadaRepository {
  obtenerPorId(id: LlamadaId): Promise<Llamada | null>;
  guardar(llamada: Llamada): Promise<void>;
  listarPendientesDeAuditar(): Promise<Llamada[]>;
}
