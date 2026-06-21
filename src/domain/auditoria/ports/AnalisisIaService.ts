import type { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import type { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import type { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import type { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';

/**
 * Resultado del análisis semántico, ya expresado en tipos de dominio.
 * La traducción desde la respuesta cruda del LLM (validación con Zod) ocurre
 * en la capa de infraestructura; el dominio solo conoce este contrato.
 */
export interface ResultadoAnalisis {
  readonly evaluaciones: EvaluacionProtocolo[];
  readonly alertas: AlertaCumplimiento[];
}

/**
 * Puerto del servicio de análisis por IA. Totalmente agnóstico del proveedor
 * (OpenAI, Anthropic, etc.) y de cualquier SDK o token. El dominio depende de
 * esta abstracción; la infraestructura inyecta la implementación (real o mock).
 */
export interface AnalisisIaService {
  analizarCumplimiento(
    transcripcion: Transcripcion,
    protocolos: TipoProtocolo[],
  ): Promise<ResultadoAnalisis>;
}
