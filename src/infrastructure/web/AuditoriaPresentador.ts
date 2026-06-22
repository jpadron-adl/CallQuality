import type { Llamada } from '@domain/llamada/Llamada';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';

/** Representación serializable de una llamada para la API. */
export interface LlamadaDto {
  readonly id: string;
  readonly agenteId: string;
  readonly fechaInicio: string;
  readonly numeroIntervenciones: number;
}

/** Representación serializable de una evaluación de protocolo. */
export interface EvaluacionDto {
  readonly protocolo: string;
  readonly cumplido: boolean;
  readonly evidencia: string;
}

/** Representación serializable de una alerta de cumplimiento. */
export interface AlertaDto {
  readonly tipo: string;
  readonly severidad: string;
  readonly evidencia: string;
}

/** Representación serializable del resultado de una auditoría para la API. */
export interface ResultadoAuditoriaDto {
  readonly id: string;
  readonly llamadaId: string;
  readonly puntuacion: number;
  readonly tieneAlertas: boolean;
  readonly evaluaciones: EvaluacionDto[];
  readonly alertas: AlertaDto[];
}

/**
 * Presentadores: traducen los agregados del dominio a DTOs planos y serializables.
 * Aíslan la forma de la respuesta HTTP de la estructura interna del dominio, de modo
 * que la API no expone value objects ni acopla el contrato externo a las entidades.
 */
export function presentarLlamada(llamada: Llamada): LlamadaDto {
  return {
    id: llamada.id.valor,
    agenteId: llamada.agenteId,
    fechaInicio: llamada.fechaInicio.toISOString(),
    numeroIntervenciones: llamada.transcripcion.intervenciones.length,
  };
}

export function presentarResultadoAuditoria(resultado: ResultadoAuditoria): ResultadoAuditoriaDto {
  return {
    id: resultado.id.valor,
    llamadaId: resultado.llamadaId.valor,
    puntuacion: resultado.puntuacion().valor,
    tieneAlertas: resultado.tieneAlertas(),
    evaluaciones: resultado.evaluaciones.map((evaluacion) => ({
      protocolo: evaluacion.tipo.valor,
      cumplido: evaluacion.cumplido,
      evidencia: evaluacion.evidencia.valor,
    })),
    alertas: resultado.alertas.map((alerta) => ({
      tipo: alerta.tipo.valor,
      severidad: alerta.severidad.valor,
      evidencia: alerta.evidencia.valor,
    })),
  };
}
