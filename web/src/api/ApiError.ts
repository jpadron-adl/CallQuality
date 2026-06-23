/**
 * Error de la capa de API del dashboard. Encapsula el código de estado HTTP y el
 * mensaje devuelto por el backend, de modo que la UI pueda distinguir un 404
 * (recurso inexistente) de un fallo del servidor sin inspeccionar respuestas crudas.
 */
export class ApiError extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }
}
