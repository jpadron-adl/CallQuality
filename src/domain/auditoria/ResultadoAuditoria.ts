import { DomainError } from '@domain/shared/DomainError';
import { PuntuacionCalidad } from '@domain/auditoria/value-objects/PuntuacionCalidad';
import type { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import type { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import type { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

/**
 * Datos necesarios para construir un ResultadoAuditoria.
 * La llamada auditada se referencia por su identidad (LlamadaId), no por el objeto:
 * los agregados se relacionan entre sí únicamente a través de sus identificadores.
 */
export interface DatosResultadoAuditoria {
  readonly id: AuditoriaId;
  readonly llamadaId: LlamadaId;
  /** Instante en que se realizó la auditoría. Se inyecta como dato (vía el puerto Reloj),
   * de modo que el dominio permanece puro y determinista (no consulta el reloj del sistema). */
  readonly fechaAuditoria: Date;
  readonly evaluaciones: EvaluacionProtocolo[];
  readonly alertas: AlertaCumplimiento[];
}

/**
 * Aggregate Root que recoge el resultado de auditar una llamada: las evaluaciones
 * de protocolo y las alertas de cumplimiento detectadas. La puntuación de calidad
 * la CALCULA el dominio a partir de las evaluaciones (porcentaje de cumplimiento).
 * Su igualdad se determina por identidad (AuditoriaId).
 */
export class ResultadoAuditoria {
  private constructor(
    private readonly _id: AuditoriaId,
    private readonly _llamadaId: LlamadaId,
    private readonly _fechaAuditoria: Date,
    private readonly _evaluaciones: readonly EvaluacionProtocolo[],
    private readonly _alertas: readonly AlertaCumplimiento[],
  ) {}

  static crear(datos: DatosResultadoAuditoria): ResultadoAuditoria {
    if (datos.evaluaciones.length === 0) {
      throw new DomainError(
        'El resultado de auditoría debe contener al menos una evaluación de protocolo para poder puntuarse.',
      );
    }
    return new ResultadoAuditoria(
      datos.id,
      datos.llamadaId,
      new Date(datos.fechaAuditoria.getTime()),
      [...datos.evaluaciones],
      [...datos.alertas],
    );
  }

  get id(): AuditoriaId {
    return this._id;
  }

  get llamadaId(): LlamadaId {
    return this._llamadaId;
  }

  get fechaAuditoria(): Date {
    return new Date(this._fechaAuditoria.getTime());
  }

  get evaluaciones(): EvaluacionProtocolo[] {
    return [...this._evaluaciones];
  }

  get alertas(): AlertaCumplimiento[] {
    return [...this._alertas];
  }

  /**
   * Puntuación de calidad como porcentaje de protocolos cumplidos,
   * redondeado al entero más cercano.
   */
  puntuacion(): PuntuacionCalidad {
    const cumplidos = this._evaluaciones.filter((evaluacion) => evaluacion.cumplido).length;
    const porcentaje = Math.round((cumplidos / this._evaluaciones.length) * 100);
    return PuntuacionCalidad.crear(porcentaje);
  }

  tieneAlertas(): boolean {
    return this._alertas.length > 0;
  }

  alertaMasGrave(): AlertaCumplimiento | null {
    return this._alertas.reduce<AlertaCumplimiento | null>((masGrave, actual) => {
      if (masGrave === null || actual.severidad.esMasGraveQue(masGrave.severidad)) {
        return actual;
      }
      return masGrave;
    }, null);
  }

  esIgualA(otro: ResultadoAuditoria): boolean {
    return this._id.esIgualA(otro._id);
  }
}
