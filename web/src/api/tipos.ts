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

/** Revisión humana de una auditoría, espejo de `RevisionDto` del backend. */
export interface RevisionDto {
  readonly revisor: string;
  readonly fechaRevision: string;
  readonly comentario: string | null;
  readonly correcciones: readonly EvaluacionDto[];
}

/** Resultado de una auditoría, devuelto por POST/GET de `/api/llamadas/:id/auditorias`. */
export interface ResultadoAuditoriaDto {
  readonly id: string;
  readonly llamadaId: string;
  /** Instante en que se realizó la auditoría, en ISO 8601. */
  readonly fechaAuditoria: string;
  readonly puntuacion: number;
  readonly tieneAlertas: boolean;
  /** Evaluaciones efectivas (con las correcciones del revisor aplicadas, si las hay). */
  readonly evaluaciones: readonly EvaluacionDto[];
  readonly alertas: readonly AlertaDto[];
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

/** Informe de desempeño de un agente, devuelto por `GET /api/agentes/:id/informe`. */
export interface InformeAgenteDto {
  readonly agenteId: string;
  readonly numeroLlamadasAuditadas: number;
  readonly puntuacionMedia: number;
  readonly protocolosMasIncumplidos: readonly ProtocoloIncumplidoDto[];
  readonly totalAlertas: number;
  readonly alertasPorSeveridad: readonly AlertasPorSeveridadDto[];
}

/** Protocolo cuyo veredicto cambió entre dos auditorías comparadas. `null` si no se evaluó. */
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

/**
 * Comparación entre dos auditorías de la misma llamada, devuelta por
 * `GET /api/auditorias/:idA/comparacion/:idB`. Refleja la valoración efectiva de cada una.
 */
export interface ComparacionAuditoriasDto {
  readonly llamadaId: string;
  readonly auditoriaIdA: string;
  readonly auditoriaIdB: string;
  readonly puntuacionA: number;
  readonly puntuacionB: number;
  readonly diferenciaPuntuacion: number;
  readonly protocolosCambiados: readonly ProtocoloCambiadoDto[];
  readonly alertasAparecidas: readonly AlertaComparadaDto[];
  readonly alertasDesaparecidas: readonly AlertaComparadaDto[];
}

/** Una corrección de un protocolo enviada al revisar una auditoría. */
export interface CorreccionEntradaDto {
  readonly protocolo: string;
  readonly cumplido: boolean;
  readonly evidencia: string;
}

/** Cuerpo de `POST /api/auditorias/:id/revision`: la revisión humana de una auditoría. */
export interface NuevaRevision {
  readonly revisor: string;
  readonly comentario?: string;
  readonly correcciones?: readonly CorreccionEntradaDto[];
}
