/**
 * Excepción base de la capa de aplicación.
 * Distingue los fallos de orquestación de casos de uso de las violaciones
 * de invariantes del dominio (DomainError).
 */
export class ApplicationError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
