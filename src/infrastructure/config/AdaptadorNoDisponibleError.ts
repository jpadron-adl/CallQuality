/**
 * Se lanza cuando se solicita un adaptador que todavía no está implementado
 * (p. ej. el servicio de IA real en modo producción).
 */
export class AdaptadorNoDisponibleError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
