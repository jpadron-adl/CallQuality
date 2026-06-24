import { z } from 'zod';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DomainError } from '@domain/shared/DomainError';
import { PersistenciaCorruptaError } from '@infrastructure/persistence/sqlite/PersistenciaCorruptaError';

/**
 * Representación plana de una Llamada lista para almacenarse como fila SQLite.
 * Las colecciones del agregado (la transcripción) se serializan como JSON, de modo
 * que el agregado se persiste y recupera como una unidad (principio DDD).
 */
export interface FilaLlamada {
  readonly id: string;
  readonly agenteId: string;
  readonly fechaInicio: string;
  readonly transcripcion: string;
}

const transcripcionSchema = z.array(
  z.object({ rol: z.string(), texto: z.string() }),
);

/** Serializa el agregado Llamada a una fila plana (dominio → almacenamiento). */
export function serializarLlamada(llamada: Llamada): FilaLlamada {
  return {
    id: llamada.id.valor,
    agenteId: llamada.agenteId,
    fechaInicio: llamada.fechaInicio.toISOString(),
    transcripcion: JSON.stringify(
      llamada.transcripcion.intervenciones.map((turno) => ({
        rol: turno.rol.valor,
        texto: turno.texto,
      })),
    ),
  };
}

/**
 * Reconstruye el agregado Llamada desde una fila persistida (almacenamiento → dominio).
 * Los datos del almacén se tratan como no confiables: se valida su forma con Zod y la
 * reconstrucción delega las invariantes en las fábricas del dominio. Cualquier
 * incompatibilidad se traduce a PersistenciaCorruptaError.
 */
export function deserializarLlamada(fila: FilaLlamada): Llamada {
  const turnos = parsearTranscripcion(fila.transcripcion);
  try {
    return Llamada.crear({
      id: LlamadaId.crear(fila.id),
      agenteId: fila.agenteId,
      fechaInicio: new Date(fila.fechaInicio),
      transcripcion: Transcripcion.crear(
        turnos.map((turno) => Intervencion.crear(IntervinienteRol.desde(turno.rol), turno.texto)),
      ),
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw new PersistenciaCorruptaError(error.message);
    }
    throw error;
  }
}

function parsearTranscripcion(crudo: string): { rol: string; texto: string }[] {
  let json: unknown;
  try {
    json = JSON.parse(crudo);
  } catch {
    throw new PersistenciaCorruptaError('la transcripción almacenada no es JSON válido.');
  }
  const resultado = transcripcionSchema.safeParse(json);
  if (!resultado.success) {
    throw new PersistenciaCorruptaError(
      `la transcripción almacenada no respeta el esquema: ${resultado.error.issues
        .map((i) => i.message)
        .join('; ')}`,
    );
  }
  return resultado.data;
}
