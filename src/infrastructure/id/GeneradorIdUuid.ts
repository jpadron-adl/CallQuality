import { randomUUID } from 'node:crypto';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';

/**
 * Adaptador de generación de identificadores basado en UUID v4.
 * Aísla la dependencia no determinista del runtime (crypto) en la infraestructura,
 * manteniendo puros el dominio y la aplicación.
 */
export class GeneradorIdUuid implements GeneradorId {
  siguiente(): string {
    return randomUUID();
  }
}
