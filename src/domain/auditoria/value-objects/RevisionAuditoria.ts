import { DomainError } from '@domain/shared/DomainError';
import type { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';

/** Datos con los que un supervisor revisa una auditoría. */
export interface DatosRevision {
  readonly revisor: string;
  readonly fechaRevision: Date;
  /** Comentario libre del revisor; opcional. */
  readonly comentario?: string;
  /**
   * Correcciones del revisor sobre evaluaciones concretas del LLM (mismo protocolo,
   * con el veredicto y la evidencia ajustados). Opcional: una revisión puede limitarse
   * a validar el análisis sin corregir nada.
   */
  readonly correcciones?: EvaluacionProtocolo[];
}

/**
 * Value Object que recoge la revisión humana de una auditoría: quién la revisó, cuándo,
 * un comentario opcional y las correcciones que introduce sobre las evaluaciones del LLM.
 * Inmutable y con copias defensivas. La validación de que las correcciones se refieren a
 * protocolos realmente evaluados corresponde al agregado `ResultadoAuditoria`, que es quien
 * conoce las evaluaciones originales.
 */
export class RevisionAuditoria {
  private constructor(
    private readonly _revisor: string,
    private readonly _fechaRevision: Date,
    private readonly _comentario: string | null,
    private readonly _correcciones: readonly EvaluacionProtocolo[],
  ) {}

  static crear(datos: DatosRevision): RevisionAuditoria {
    const revisor = datos.revisor.trim();
    if (revisor === '') {
      throw new DomainError('La revisión debe indicar quién la realiza (revisor).');
    }
    const comentario = datos.comentario?.trim();
    return new RevisionAuditoria(
      revisor,
      new Date(datos.fechaRevision.getTime()),
      comentario === undefined || comentario === '' ? null : comentario,
      [...(datos.correcciones ?? [])],
    );
  }

  get revisor(): string {
    return this._revisor;
  }

  get fechaRevision(): Date {
    return new Date(this._fechaRevision.getTime());
  }

  get comentario(): string | null {
    return this._comentario;
  }

  get correcciones(): EvaluacionProtocolo[] {
    return [...this._correcciones];
  }
}
