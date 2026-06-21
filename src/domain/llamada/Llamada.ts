import { DomainError } from '@domain/shared/DomainError';
import type { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import type { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';

/**
 * Datos necesarios para construir una Llamada.
 * La fecha de inicio se inyecta como dato: el dominio permanece puro y determinista
 * (no consulta el reloj del sistema).
 */
export interface DatosLlamada {
  readonly id: LlamadaId;
  readonly agenteId: string;
  readonly fechaInicio: Date;
  readonly transcripcion: Transcripcion;
}

/**
 * Aggregate Root del contexto de auditoría: una llamada con su transcripción y metadatos.
 * Su igualdad se determina por identidad (LlamadaId), no por su contenido.
 */
export class Llamada {
  private constructor(
    private readonly _id: LlamadaId,
    private readonly _agenteId: string,
    private readonly _fechaInicio: Date,
    private readonly _transcripcion: Transcripcion,
  ) {}

  static crear(datos: DatosLlamada): Llamada {
    const agenteId = datos.agenteId.trim();
    if (agenteId.length === 0) {
      throw new DomainError('El identificador del agente no puede estar vacío.');
    }
    return new Llamada(datos.id, agenteId, new Date(datos.fechaInicio.getTime()), datos.transcripcion);
  }

  get id(): LlamadaId {
    return this._id;
  }

  get agenteId(): string {
    return this._agenteId;
  }

  get fechaInicio(): Date {
    return new Date(this._fechaInicio.getTime());
  }

  get transcripcion(): Transcripcion {
    return this._transcripcion;
  }

  esIgualA(otra: Llamada): boolean {
    return this._id.esIgualA(otra._id);
  }
}
