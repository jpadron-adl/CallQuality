import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { Reloj } from '@domain/shared/ports/Reloj';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { AuditoriaNoEncontradaError } from '@application/shared/AuditoriaNoEncontradaError';

/** Corrección de un protocolo tal y como entra al caso de uso (datos planos). */
export interface CorreccionEntrada {
  readonly protocolo: string;
  readonly cumplido: boolean;
  readonly evidencia: string;
}

/**
 * Comando para revisar una auditoría (human-in-the-loop): quién revisa, un comentario
 * opcional y las correcciones que introduce sobre las evaluaciones del LLM. La fecha de
 * revisión no se aporta: el caso de uso la sella con el reloj (instante de la revisión).
 */
export interface ComandoRevisarAuditoria {
  readonly auditoriaId: string;
  readonly revisor: string;
  readonly comentario?: string;
  readonly correcciones?: readonly CorreccionEntrada[];
}

/**
 * Caso de uso: registra la revisión humana de una auditoría existente. Recupera el agregado,
 * traduce las correcciones a value objects del dominio, delega en él la revisión (que valida
 * las invariantes y recalcula la puntuación efectiva) y lo persiste. No conoce ninguna
 * tecnología concreta.
 */
export class RevisarAuditoria {
  constructor(
    private readonly auditorias: AuditoriaRepository,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoRevisarAuditoria): Promise<ResultadoAuditoria> {
    const id = AuditoriaId.crear(comando.auditoriaId);
    const auditoria = await this.auditorias.obtenerPorId(id);
    if (auditoria === null) {
      throw new AuditoriaNoEncontradaError(id);
    }

    const correcciones = (comando.correcciones ?? []).map((correccion) =>
      EvaluacionProtocolo.crear(
        TipoProtocolo.desde(correccion.protocolo),
        correccion.cumplido,
        Evidencia.crear(correccion.evidencia),
      ),
    );

    auditoria.revisar({
      revisor: comando.revisor,
      fechaRevision: this.reloj.ahora(),
      ...(comando.comentario === undefined ? {} : { comentario: comando.comentario }),
      correcciones,
    });

    await this.auditorias.guardar(auditoria);
    return auditoria;
  }
}
