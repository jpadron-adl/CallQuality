import { z } from 'zod';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { DomainError } from '@domain/shared/DomainError';
import { PersistenciaCorruptaError } from '@infrastructure/persistence/sqlite/PersistenciaCorruptaError';

/**
 * Representación plana de un ResultadoAuditoria lista para almacenarse como fila SQLite.
 * Las colecciones del agregado (evaluaciones y alertas) se serializan como JSON, de modo
 * que el agregado se persiste y recupera como una unidad (principio DDD).
 */
export interface FilaAuditoria {
  readonly id: string;
  readonly llamadaId: string;
  readonly fechaAuditoria: string;
  readonly evaluaciones: string;
  readonly alertas: string;
}

const evaluacionesSchema = z.array(
  z.object({ protocolo: z.string(), cumplido: z.boolean(), evidencia: z.string() }),
);

const alertasSchema = z.array(
  z.object({ tipo: z.string(), severidad: z.string(), evidencia: z.string() }),
);

/** Serializa el agregado ResultadoAuditoria a una fila plana (dominio → almacenamiento). */
export function serializarAuditoria(resultado: ResultadoAuditoria): FilaAuditoria {
  return {
    id: resultado.id.valor,
    llamadaId: resultado.llamadaId.valor,
    fechaAuditoria: resultado.fechaAuditoria.toISOString(),
    evaluaciones: JSON.stringify(
      resultado.evaluaciones.map((evaluacion) => ({
        protocolo: evaluacion.tipo.valor,
        cumplido: evaluacion.cumplido,
        evidencia: evaluacion.evidencia.valor,
      })),
    ),
    alertas: JSON.stringify(
      resultado.alertas.map((alerta) => ({
        tipo: alerta.tipo.valor,
        severidad: alerta.severidad.valor,
        evidencia: alerta.evidencia.valor,
      })),
    ),
  };
}

/**
 * Reconstruye el agregado ResultadoAuditoria desde una fila persistida.
 * Los datos del almacén se tratan como no confiables: se valida su forma con Zod y la
 * reconstrucción delega las invariantes y los catálogos en las fábricas del dominio.
 * Cualquier incompatibilidad se traduce a PersistenciaCorruptaError.
 */
export function deserializarAuditoria(fila: FilaAuditoria): ResultadoAuditoria {
  const evaluaciones = parsear(fila.evaluaciones, evaluacionesSchema, 'las evaluaciones');
  const alertas = parsear(fila.alertas, alertasSchema, 'las alertas');
  try {
    return ResultadoAuditoria.crear({
      id: AuditoriaId.crear(fila.id),
      llamadaId: LlamadaId.crear(fila.llamadaId),
      fechaAuditoria: new Date(fila.fechaAuditoria),
      evaluaciones: evaluaciones.map((evaluacion) =>
        EvaluacionProtocolo.crear(
          TipoProtocolo.desde(evaluacion.protocolo),
          evaluacion.cumplido,
          Evidencia.crear(evaluacion.evidencia),
        ),
      ),
      alertas: alertas.map((alerta) =>
        AlertaCumplimiento.crear(
          TipoAlerta.desde(alerta.tipo),
          SeveridadAlerta.desde(alerta.severidad),
          Evidencia.crear(alerta.evidencia),
        ),
      ),
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw new PersistenciaCorruptaError(error.message);
    }
    throw error;
  }
}

function parsear<T>(crudo: string, esquema: z.ZodType<T>, etiqueta: string): T {
  let json: unknown;
  try {
    json = JSON.parse(crudo);
  } catch {
    throw new PersistenciaCorruptaError(`${etiqueta} almacenadas no son JSON válido.`);
  }
  const resultado = esquema.safeParse(json);
  if (!resultado.success) {
    throw new PersistenciaCorruptaError(
      `${etiqueta} almacenadas no respetan el esquema: ${resultado.error.issues
        .map((i) => i.message)
        .join('; ')}`,
    );
  }
  return resultado.data;
}
