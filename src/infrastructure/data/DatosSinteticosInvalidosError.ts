/**
 * Se lanza cuando los datos sintéticos del Modo Demo no cumplen el esquema esperado.
 * Aísla los detalles de validación (Zod) tras un error propio de la infraestructura.
 */
export class DatosSinteticosInvalidosError extends Error {
  constructor(detalle: string) {
    super(`Los datos sintéticos de llamadas no son válidos: ${detalle}`);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
