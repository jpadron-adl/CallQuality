import { DomainError } from '@domain/shared/DomainError';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import type { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

/**
 * Value Object que representa el diálogo completo de una llamada como una
 * secuencia ordenada e inmutable de intervenciones.
 * Invariante: debe contener al menos una intervención.
 */
export class Transcripcion {
  private constructor(private readonly _intervenciones: readonly Intervencion[]) {}

  static crear(intervenciones: Intervencion[]): Transcripcion {
    if (intervenciones.length === 0) {
      throw new DomainError('La transcripción debe contener al menos una intervención.');
    }
    return new Transcripcion([...intervenciones]);
  }

  get intervenciones(): Intervencion[] {
    return [...this._intervenciones];
  }

  primerTurno(): Intervencion {
    return this._intervenciones[0]!;
  }

  ultimoTurno(): Intervencion {
    return this._intervenciones[this._intervenciones.length - 1]!;
  }

  intervino(rol: IntervinienteRol): boolean {
    return this._intervenciones.some((intervencion) => intervencion.rol.esIgualA(rol));
  }

  intervencionesDe(rol: IntervinienteRol): Intervencion[] {
    return this._intervenciones.filter((intervencion) => intervencion.rol.esIgualA(rol));
  }
}
