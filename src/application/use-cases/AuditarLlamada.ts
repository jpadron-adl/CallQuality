import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { AnalisisIaService } from '@domain/auditoria/ports/AnalisisIaService';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { LlamadaNoEncontradaError } from '@application/shared/LlamadaNoEncontradaError';

/**
 * Caso de uso: audita una llamada existente.
 * Orquesta el dominio y los puertos (repositorios y servicio de IA) sin conocer
 * ninguna tecnología concreta. La puntuación la calcula el dominio.
 */
export class AuditarLlamada {
  constructor(
    private readonly llamadas: LlamadaRepository,
    private readonly analisisIa: AnalisisIaService,
    private readonly auditorias: AuditoriaRepository,
    private readonly generadorId: GeneradorId,
  ) {}

  async ejecutar(llamadaId: LlamadaId): Promise<ResultadoAuditoria> {
    const llamada = await this.llamadas.obtenerPorId(llamadaId);
    if (llamada === null) {
      throw new LlamadaNoEncontradaError(llamadaId);
    }

    const analisis = await this.analisisIa.analizarCumplimiento(
      llamada.transcripcion,
      TipoProtocolo.todos(),
    );

    const resultado = ResultadoAuditoria.crear({
      id: AuditoriaId.crear(this.generadorId.siguiente()),
      llamadaId: llamada.id,
      evaluaciones: analisis.evaluaciones,
      alertas: analisis.alertas,
    });

    await this.auditorias.guardar(resultado);
    return resultado;
  }
}
