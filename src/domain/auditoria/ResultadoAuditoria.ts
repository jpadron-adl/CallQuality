import { DomainError } from '@domain/shared/DomainError';
import { PuntuacionCalidad } from '@domain/auditoria/value-objects/PuntuacionCalidad';
import { RevisionAuditoria } from '@domain/auditoria/value-objects/RevisionAuditoria';
import type { DatosRevision } from '@domain/auditoria/value-objects/RevisionAuditoria';
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
  /** Revisión humana de la auditoría; null mientras no ha sido revisada. */
  private _revision: RevisionAuditoria | null = null;

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
   * Revisión humana de la auditoría, o null si aún no ha sido revisada.
   * Inmutable: el agregado expone su revisión pero no permite mutarla desde fuera.
   */
  get revision(): RevisionAuditoria | null {
    return this._revision;
  }

  estaRevisada(): boolean {
    return this._revision !== null;
  }

  /**
   * Registra la revisión humana de la auditoría. Las correcciones deben referirse a
   * protocolos realmente evaluados; en otro caso es un error de dominio. Una nueva
   * revisión reemplaza a la anterior (el supervisor puede recorregir).
   */
  revisar(datos: DatosRevision): void {
    const revision = RevisionAuditoria.crear(datos);
    for (const correccion of revision.correcciones) {
      const evaluado = this._evaluaciones.some((evaluacion) =>
        evaluacion.tipo.esIgualA(correccion.tipo),
      );
      if (!evaluado) {
        throw new DomainError(
          `No se puede corregir el protocolo "${correccion.tipo.valor}": no forma parte de esta auditoría.`,
        );
      }
    }
    this._revision = revision;
  }

  /**
   * Evaluaciones tras aplicar las correcciones del revisor (si las hay): cada protocolo
   * corregido sustituye al veredicto original del LLM, conservándose el resto. Sin revisión,
   * coincide con las evaluaciones originales.
   */
  evaluacionesEfectivas(): EvaluacionProtocolo[] {
    if (this._revision === null) {
      return [...this._evaluaciones];
    }
    const correcciones = this._revision.correcciones;
    return this._evaluaciones.map((original) => {
      const correccion = correcciones.find((c) => c.tipo.esIgualA(original.tipo));
      return correccion ?? original;
    });
  }

  /**
   * Puntuación de calidad como porcentaje de protocolos cumplidos, redondeado al entero
   * más cercano. Se calcula sobre las evaluaciones efectivas, de modo que las correcciones
   * del revisor ajustan la puntuación.
   */
  puntuacion(): PuntuacionCalidad {
    const efectivas = this.evaluacionesEfectivas();
    const cumplidos = efectivas.filter((evaluacion) => evaluacion.cumplido).length;
    const porcentaje = Math.round((cumplidos / efectivas.length) * 100);
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
