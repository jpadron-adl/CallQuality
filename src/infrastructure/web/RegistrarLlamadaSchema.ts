import { z } from 'zod';
import type { ComandoRegistrarLlamada } from '@application/use-cases/RegistrarLlamada';

/**
 * Esquema Zod del cuerpo CRUDO de la petición de alta de una llamada (anti-no-determinismo
 * en la frontera HTTP). Valida la forma sintáctica del payload; la pertenencia del rol al
 * catálogo del dominio (IntervinienteRol) se delega en el value object al construir el
 * agregado. La fecha de inicio es opcional y debe venir en formato ISO 8601.
 */
const intervencionEntradaSchema = z.object({
  rol: z.string().min(1),
  texto: z.string().trim().min(1),
});

export const registrarLlamadaSchema = z.object({
  agenteId: z.string().trim().min(1),
  fechaInicio: z.string().datetime().optional(),
  intervenciones: z.array(intervencionEntradaSchema).min(1),
});

export type CuerpoRegistrarLlamada = z.infer<typeof registrarLlamadaSchema>;

/**
 * Traduce el cuerpo ya validado a un comando del caso de uso, convirtiendo la fecha
 * ISO a un objeto Date. La propiedad opcional se omite por completo cuando no llega
 * (coherente con exactOptionalPropertyTypes).
 */
export function aComandoRegistrarLlamada(cuerpo: CuerpoRegistrarLlamada): ComandoRegistrarLlamada {
  const base = {
    agenteId: cuerpo.agenteId,
    intervenciones: cuerpo.intervenciones,
  };
  return cuerpo.fechaInicio === undefined
    ? base
    : { ...base, fechaInicio: new Date(cuerpo.fechaInicio) };
}
