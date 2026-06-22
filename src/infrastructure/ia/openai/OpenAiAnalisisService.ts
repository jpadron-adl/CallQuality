import type { AnalisisIaService, ResultadoAnalisis } from '@domain/auditoria/ports/AnalisisIaService';
import type { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { DomainError } from '@domain/shared/DomainError';
import type { ClienteChatCompletions } from '@infrastructure/ia/openai/ClienteChatCompletions';
import { RespuestaIaInvalidaError } from '@infrastructure/ia/openai/RespuestaIaInvalidaError';
import {
  respuestaAnalisisSchema,
  type RespuestaAnalisisCruda,
} from '@infrastructure/ia/openai/RespuestaAnalisisSchema';

const INSTRUCCION_SISTEMA = [
  'Eres un auditor experto de calidad de llamadas de un call center.',
  'Analizas la transcripción y determinas, para cada protocolo solicitado, si se cumple,',
  'aportando siempre una cita textual de la transcripción como evidencia.',
  'Detectas además alertas de cumplimiento (FRAUDE, QUEJA_GRAVE, AMENAZA, LENGUAJE_OFENSIVO),',
  'con su severidad (BAJA, MEDIA, ALTA, CRITICA) y su evidencia textual.',
  'Respondes EXCLUSIVAMENTE con un objeto JSON que respete este formato:',
  '{"evaluaciones":[{"protocolo":"...","cumplido":true|false,"evidencia":"..."}],',
  '"alertas":[{"tipo":"...","severidad":"...","evidencia":"..."}]}.',
  'No incluyas texto fuera del JSON.',
].join(' ');

/**
 * Adaptador de análisis para el Modo Producción (APP_MODE=production).
 * Delega el análisis semántico en un LLM (a través del puerto ClienteChatCompletions),
 * valida la respuesta cruda con Zod para neutralizar el no-determinismo y la traduce
 * a value objects del dominio. Cualquier respuesta no interpretable se aísla tras
 * RespuestaIaInvalidaError. El dominio nunca conoce el proveedor ni el SDK.
 */
export class OpenAiAnalisisService implements AnalisisIaService {
  constructor(private readonly cliente: ClienteChatCompletions) {}

  async analizarCumplimiento(
    transcripcion: Transcripcion,
    protocolos: TipoProtocolo[],
  ): Promise<ResultadoAnalisis> {
    const contenido = await this.cliente.completar({
      system: INSTRUCCION_SISTEMA,
      user: this.construirPrompt(transcripcion, protocolos),
    });

    const cruda = this.validar(contenido);
    return this.traducir(cruda);
  }

  private construirPrompt(transcripcion: Transcripcion, protocolos: TipoProtocolo[]): string {
    const dialogo = transcripcion.intervenciones
      .map((intervencion) => `${intervencion.rol.valor}: ${intervencion.texto}`)
      .join('\n');
    const lista = protocolos.map((protocolo) => protocolo.valor).join(', ');
    return [
      'Protocolos a evaluar: ' + lista + '.',
      '',
      'Transcripción de la llamada:',
      dialogo,
    ].join('\n');
  }

  private validar(contenido: string): RespuestaAnalisisCruda {
    let json: unknown;
    try {
      json = JSON.parse(contenido);
    } catch {
      throw new RespuestaIaInvalidaError('el contenido devuelto no es JSON.');
    }

    const resultado = respuestaAnalisisSchema.safeParse(json);
    if (!resultado.success) {
      throw new RespuestaIaInvalidaError(resultado.error.issues.map((i) => i.message).join('; '));
    }
    return resultado.data;
  }

  private traducir(cruda: RespuestaAnalisisCruda): ResultadoAnalisis {
    try {
      const evaluaciones = cruda.evaluaciones.map((e) =>
        EvaluacionProtocolo.crear(
          TipoProtocolo.desde(e.protocolo),
          e.cumplido,
          Evidencia.crear(e.evidencia),
        ),
      );
      const alertas = cruda.alertas.map((a) =>
        AlertaCumplimiento.crear(
          TipoAlerta.desde(a.tipo),
          SeveridadAlerta.desde(a.severidad),
          Evidencia.crear(a.evidencia),
        ),
      );
      return { evaluaciones, alertas };
    } catch (error) {
      if (error instanceof DomainError) {
        throw new RespuestaIaInvalidaError(error.message);
      }
      throw error;
    }
  }
}
