/**
 * Se lanza cuando la respuesta del LLM no se puede interpretar como un análisis
 * válido: no es JSON, no respeta el esquema esperado, o contiene valores fuera
 * de los catálogos del dominio. Aísla los detalles del proveedor y de Zod tras un
 * error propio de la infraestructura, evitando que se filtren al resto del sistema.
 */
export class RespuestaIaInvalidaError extends Error {
  constructor(detalle: string) {
    super(`La respuesta del servicio de IA no es válida: ${detalle}`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
