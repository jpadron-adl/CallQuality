import { DomainError } from '@domain/shared/DomainError';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

/**
 * Value Object que representa un único turno de diálogo dentro de la transcripción:
 * quién interviene (rol) y qué dice (texto). Inmutable y con igualdad estructural.
 * El orden temporal de los turnos lo aporta su posición en la Transcripcion.
 */
export class Intervencion {
  private constructor(
    private readonly _rol: IntervinienteRol,
    private readonly _texto: string,
  ) {}

  static crear(rol: IntervinienteRol, texto: string): Intervencion {
    const normalizado = texto.trim();
    if (normalizado.length === 0) {
      throw new DomainError('El texto de la intervención no puede estar vacío.');
    }
    return new Intervencion(rol, normalizado);
  }

  get rol(): IntervinienteRol {
    return this._rol;
  }

  get texto(): string {
    return this._texto;
  }

  esIgualA(otra: Intervencion): boolean {
    return this._rol.esIgualA(otra._rol) && this._texto === otra._texto;
  }
}
