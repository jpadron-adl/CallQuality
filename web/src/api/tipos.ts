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

/** Un turno de la transcripción tal como lo envía el dashboard al dar de alta una llamada. */
export interface IntervencionEntradaDto {
  readonly rol: string;
  readonly texto: string;
}

/**
 * Cuerpo de `POST /api/llamadas`: alta de una llamada a partir de su transcripción textual.
 * Es el mismo formato de los ficheros de ejemplo (`ejemplos/llamadas/`) y de las llamadas
 * sintéticas, de modo que un fichero puede subirse y enviarse tal cual.
 */
export interface NuevaLlamada {
  readonly agenteId: string;
  readonly transcripcion: readonly IntervencionEntradaDto[];
  /** Instante de inicio en ISO 8601; opcional (el backend usa el reloj si se omite). */
  readonly fechaInicio?: string;
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
