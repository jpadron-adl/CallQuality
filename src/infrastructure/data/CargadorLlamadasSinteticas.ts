import { z } from 'zod';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { DatosSinteticosInvalidosError } from '@infrastructure/data/DatosSinteticosInvalidosError';

const intervencionSchema = z.object({
  rol: z.enum(['AGENTE', 'CLIENTE', 'SISTEMA']),
  texto: z.string().min(1),
});

const llamadaSchema = z.object({
  id: z.string().min(1),
  agenteId: z.string().min(1),
  fechaInicio: z.string().refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: 'fechaInicio debe ser una fecha ISO 8601 válida',
  }),
  transcripcion: z.array(intervencionSchema).min(1),
});

const esquema = z.array(llamadaSchema);

/**
 * Convierte datos sintéticos crudos (p. ej. cargados desde un JSON local) en
 * agregados de dominio Llamada. Valida la forma de los datos con Zod (frontera de
 * la infraestructura) y delega las invariantes de negocio en el propio dominio.
 */
export class CargadorLlamadasSinteticas {
  mapear(datos: unknown): Llamada[] {
    const resultado = esquema.safeParse(datos);
    if (!resultado.success) {
      throw new DatosSinteticosInvalidosError(resultado.error.issues.map((i) => i.message).join('; '));
    }

    return resultado.data.map((llamada) =>
      Llamada.crear({
        id: LlamadaId.crear(llamada.id),
        agenteId: llamada.agenteId,
        fechaInicio: new Date(llamada.fechaInicio),
        transcripcion: Transcripcion.crear(
          llamada.transcripcion.map((turno) =>
            Intervencion.crear(IntervinienteRol.desde(turno.rol), turno.texto),
          ),
        ),
      }),
    );
  }
}
