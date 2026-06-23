import type { Reloj } from '@domain/shared/ports/Reloj';

/**
 * Adaptador del puerto Reloj basado en el reloj del sistema.
 * Aísla la dependencia no determinista del tiempo (`new Date()`) en la infraestructura,
 * manteniendo puros el dominio y la aplicación.
 */
export class RelojDelSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
