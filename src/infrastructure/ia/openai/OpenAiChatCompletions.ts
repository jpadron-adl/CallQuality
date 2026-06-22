import OpenAI from 'openai';
import type { OpenAiConfig } from '@infrastructure/config/AppConfig';
import type { ClienteChatCompletions, PeticionChat } from '@infrastructure/ia/openai/ClienteChatCompletions';
import { RespuestaIaInvalidaError } from '@infrastructure/ia/openai/RespuestaIaInvalidaError';

/**
 * Adaptador de borde que implementa el puerto ClienteChatCompletions sobre el SDK
 * oficial de OpenAI. Es el ÚNICO punto del sistema que conoce el SDK y la red; toda
 * la lógica de prompt, validación y traducción vive en OpenAiAnalisisService, ajeno
 * al proveedor. Fuerza la salida a JSON con response_format para acotar la respuesta.
 */
export class OpenAiChatCompletions implements ClienteChatCompletions {
  private readonly cliente: OpenAI;

  constructor(private readonly config: OpenAiConfig) {
    this.cliente = new OpenAI({ apiKey: config.apiKey });
  }

  async completar(peticion: PeticionChat): Promise<string> {
    const completion = await this.cliente.chat.completions.create({
      model: this.config.modelo,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: peticion.system },
        { role: 'user', content: peticion.user },
      ],
    });

    const contenido = completion.choices[0]?.message?.content;
    if (contenido === null || contenido === undefined || contenido.length === 0) {
      throw new RespuestaIaInvalidaError('el proveedor no devolvió contenido en la respuesta.');
    }
    return contenido;
  }
}
