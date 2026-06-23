/**
 * Tipos del contrato HTTP de la API de auditoría, espejo de los DTOs que producen los
 * presentadores del backend (`src/infrastructure/web/AuditoriaPresentador.ts`). El
 * dashboard consume exclusivamente estas formas planas, nunca los value objects del dominio.
 */

/** Llamada pendiente de auditar, tal como la devuelve `GET /api/llamadas`. */
export interface LlamadaDto {
  readonly id: string;
  readonly agenteId: string;
  readonly fechaInicio: string;
  readonly numeroIntervenciones: number;
}

/** Evaluación de un protocolo dentro de un resultado de auditoría. */
export interface EvaluacionDto {
  readonly protocolo: string;
  readonly cumplido: boolean;
  readonly evidencia: string;
}

/** Alerta de cumplimiento detectada durante la auditoría. */
export interface AlertaDto {
  readonly tipo: string;
  readonly severidad: string;
  readonly evidencia: string;
}

/** Resultado de una auditoría, devuelto por POST/GET de `/api/llamadas/:id/auditorias`. */
export interface ResultadoAuditoriaDto {
  readonly id: string;
  readonly llamadaId: string;
  /** Instante en que se realizó la auditoría, en ISO 8601. */
  readonly fechaAuditoria: string;
  readonly puntuacion: number;
  readonly tieneAlertas: boolean;
  readonly evaluaciones: readonly EvaluacionDto[];
  readonly alertas: readonly AlertaDto[];
}
