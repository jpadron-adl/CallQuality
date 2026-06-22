/**
 * Petición de chat ya reducida a lo que necesita el análisis: una instrucción de
 * sistema y el contenido de usuario. Sin tipos del SDK ni detalles del proveedor.
 */
export interface PeticionChat {
  readonly system: string;
  readonly user: string;
}

/**
 * Puerto fino que abstrae una llamada de chat a un LLM y devuelve su contenido
 * textual crudo (se espera un JSON). Aísla el SDK concreto (OpenAI) tras una
 * interfaz mínima, de modo que la lógica de prompt, validación y traducción del
 * adaptador de análisis sea testeable en memoria sin tocar la red.
 */
export interface ClienteChatCompletions {
  completar(peticion: PeticionChat): Promise<string>;
}
