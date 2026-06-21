/**
 * Se lanza cuando la configuración de arranque (p. ej. APP_MODE) no es válida.
 */
export class ConfiguracionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
