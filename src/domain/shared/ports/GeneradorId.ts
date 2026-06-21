/**
 * Puerto para la generación de identificadores técnicos únicos.
 * Aísla el dominio de fuentes no deterministas (relojes, generadores aleatorios):
 * la implementación concreta (p. ej. crypto.randomUUID) vive en infraestructura.
 */
export interface GeneradorId {
  siguiente(): string;
}
