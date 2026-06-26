import { z } from 'zod';
import type { ComandoRevisarAuditoria } from '@application/use-cases/RevisarAuditoria';

/**
 * Esquema Zod del cuerpo CRUDO de la petición de revisión de una auditoría (anti-no-determinismo
 * en la frontera HTTP). Valida la forma sintáctica; la pertenencia del protocolo al catálogo del
 * dominio (TipoProtocolo) se delega en el value object al construir las correcciones. El
 * identificador de la auditoría viaja en la ruta, no en el cuerpo.
 */
const correccionSchema = z.object({
  protocolo: z.string().min(1),
  cumplido: z.boolean(),
  evidencia: z.string().trim().min(1),
});

export const revisarAuditoriaSchema = z.object({
  revisor: z.string().trim().min(1),
  comentario: z.string().trim().min(1).optional(),
  correcciones: z.array(correccionSchema).optional(),
});

export type CuerpoRevisarAuditoria = z.infer<typeof revisarAuditoriaSchema>;

/**
 * Traduce el cuerpo ya validado a un comando del caso de uso, incorporando el identificador
 * de la auditoría procedente de la ruta. Las propiedades opcionales se omiten por completo
 * cuando no llegan (coherente con exactOptionalPropertyTypes).
 */
export function aComandoRevisarAuditoria(
  auditoriaId: string,
  cuerpo: CuerpoRevisarAuditoria,
): ComandoRevisarAuditoria {
  return {
    auditoriaId,
    revisor: cuerpo.revisor,
    ...(cuerpo.comentario === undefined ? {} : { comentario: cuerpo.comentario }),
    ...(cuerpo.correcciones === undefined ? {} : { correcciones: cuerpo.correcciones }),
  };
}
