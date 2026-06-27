import type { Llamada } from '@domain/llamada/Llamada';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import type { InformeAgente } from '@domain/auditoria/InformeAgente';
import type { ComparacionAuditorias } from '@domain/auditoria/ComparacionAuditorias';

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

/** Representación serializable de la revisión humana de una auditoría. */
export interface RevisionDto {
  readonly revisor: string;
  readonly fechaRevision: string;
  readonly comentario: string | null;
  readonly correcciones: EvaluacionDto[];
}

/** Representación serializable del resultado de una auditoría para la API. */
export interface ResultadoAuditoriaDto {
  readonly id: string;
  readonly llamadaId: string;
  readonly fechaAuditoria: string;
  readonly puntuacion: number;
  readonly tieneAlertas: boolean;
  /** Evaluaciones efectivas (con las correcciones del revisor aplicadas, si las hay). */
  readonly evaluaciones: EvaluacionDto[];
  readonly alertas: AlertaDto[];
  /** Revisión humana, o null si la auditoría no ha sido revisada. */
  readonly revision: RevisionDto | null;
}

/** Recuento de cumplimiento de un protocolo en el informe de un agente. */
export interface ProtocoloIncumplidoDto {
  readonly protocolo: string;
  readonly incumplimientos: number;
  readonly evaluaciones: number;
}

/** Recuento de alertas por severidad en el informe de un agente. */
export interface AlertasPorSeveridadDto {
  readonly severidad: string;
  readonly total: number;
}

/** Representación serializable del informe de desempeño de un agente para la API. */
export interface InformeAgenteDto {
  readonly agenteId: string;
  readonly numeroLlamadasAuditadas: number;
  readonly puntuacionMedia: number;
  readonly protocolosMasIncumplidos: ProtocoloIncumplidoDto[];
  readonly totalAlertas: number;
  readonly alertasPorSeveridad: AlertasPorSeveridadDto[];
}

/** Protocolo cuyo veredicto cambió entre dos auditorías comparadas. */
export interface ProtocoloCambiadoDto {
  readonly protocolo: string;
  readonly cumplidoA: boolean | null;
  readonly cumplidoB: boolean | null;
}

/** Alerta presente en solo una de las auditorías comparadas. */
export interface AlertaComparadaDto {
  readonly tipo: string;
  readonly severidad: string;
}

/** Representación serializable de la comparación entre dos auditorías de una llamada. */
export interface ComparacionAuditoriasDto {
  readonly llamadaId: string;
  readonly auditoriaIdA: string;
  readonly auditoriaIdB: string;
  readonly puntuacionA: number;
  readonly puntuacionB: number;
  readonly diferenciaPuntuacion: number;
  readonly protocolosCambiados: ProtocoloCambiadoDto[];
  readonly alertasAparecidas: AlertaComparadaDto[];
  readonly alertasDesaparecidas: AlertaComparadaDto[];
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

function presentarEvaluacion(evaluacion: {
  tipo: { valor: string };
  cumplido: boolean;
  evidencia: { valor: string };
}): EvaluacionDto {
  return {
    protocolo: evaluacion.tipo.valor,
    cumplido: evaluacion.cumplido,
    evidencia: evaluacion.evidencia.valor,
  };
}

export function presentarResultadoAuditoria(resultado: ResultadoAuditoria): ResultadoAuditoriaDto {
  const revision = resultado.revision;
  return {
    id: resultado.id.valor,
    llamadaId: resultado.llamadaId.valor,
    fechaAuditoria: resultado.fechaAuditoria.toISOString(),
    puntuacion: resultado.puntuacion().valor,
    tieneAlertas: resultado.tieneAlertas(),
    evaluaciones: resultado.evaluacionesEfectivas().map(presentarEvaluacion),
    alertas: resultado.alertas.map((alerta) => ({
      tipo: alerta.tipo.valor,
      severidad: alerta.severidad.valor,
      evidencia: alerta.evidencia.valor,
    })),
    revision:
      revision === null
        ? null
        : {
            revisor: revision.revisor,
            fechaRevision: revision.fechaRevision.toISOString(),
            comentario: revision.comentario,
            correcciones: revision.correcciones.map(presentarEvaluacion),
          },
  };
}

export function presentarInformeAgente(informe: InformeAgente): InformeAgenteDto {
  return {
    agenteId: informe.agenteId,
    numeroLlamadasAuditadas: informe.numeroLlamadasAuditadas,
    puntuacionMedia: informe.puntuacionMedia,
    protocolosMasIncumplidos: informe.protocolosMasIncumplidos.map((p) => ({ ...p })),
    totalAlertas: informe.totalAlertas,
    alertasPorSeveridad: informe.alertasPorSeveridad.map((a) => ({ ...a })),
  };
}

export function presentarComparacionAuditorias(
  comparacion: ComparacionAuditorias,
): ComparacionAuditoriasDto {
  return {
    llamadaId: comparacion.llamadaId,
    auditoriaIdA: comparacion.auditoriaIdA,
    auditoriaIdB: comparacion.auditoriaIdB,
    puntuacionA: comparacion.puntuacionA,
    puntuacionB: comparacion.puntuacionB,
    diferenciaPuntuacion: comparacion.diferenciaPuntuacion,
    protocolosCambiados: comparacion.protocolosCambiados.map((p) => ({ ...p })),
    alertasAparecidas: comparacion.alertasAparecidas.map((a) => ({ ...a })),
    alertasDesaparecidas: comparacion.alertasDesaparecidas.map((a) => ({ ...a })),
  };
}
