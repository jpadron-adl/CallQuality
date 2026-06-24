/**
 * Error de infraestructura: los datos recuperados del almacén persistente no se
 * ajustan a la forma esperada (JSON inválido, esquema violado o valores fuera de
 * los catálogos del dominio). Aísla a las capas superiores de los detalles del
 * almacenamiento y señala una corrupción o una migración pendiente.
 */
export class PersistenciaCorruptaError extends Error {
  constructor(detalle: string) {
    super(`Los datos persistidos están corruptos o son incompatibles: ${detalle}`);
    this.name = 'PersistenciaCorruptaError';
  }
}
