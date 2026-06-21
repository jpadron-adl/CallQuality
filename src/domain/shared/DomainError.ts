/**
 * Excepción base para violaciones de invariantes del dominio.
 * Toda regla de negocio incumplida debe expresarse como una subclase de esta.
 */
export class DomainError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
