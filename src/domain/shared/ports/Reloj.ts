/**
 * Puerto para obtener el instante actual.
 * Aísla el dominio y la aplicación de la fuente no determinista del tiempo (el reloj
 * del sistema): la implementación concreta (p. ej. `new Date()`) vive en infraestructura.
 * Permite además fijar el tiempo en las pruebas para que sean deterministas.
 */
export interface Reloj {
  ahora(): Date;
}
