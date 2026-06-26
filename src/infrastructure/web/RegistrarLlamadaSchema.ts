import { z } from 'zod';
import type { ComandoRegistrarLlamada } from '@application/use-cases/RegistrarLlamada';

/**
 * Esquema Zod del cuerpo CRUDO de la petición de alta de una llamada (anti-no-determinismo
 * en la frontera HTTP). El contrato es el mismo formato de las llamadas sintéticas
 * (`llamadas-demo.json`): `{ agenteId, fechaInicio?, transcripcion: [{ rol, texto }] }`, de
 * modo que un fichero de ejemplo puede subirse tal cual. Valida la forma sintáctica del
 * payload; la pertenencia del rol al catálogo del dominio (IntervinienteRol) se delega en
 * el value object al construir el agregado. La fecha de inicio es opcional y debe venir en
 * formato ISO 8601. Un `id` presente en el fichero se ignora (lo genera el sistema), igual
 * que cualquier otra clave desconocida, gracias al `strip` por defecto de Zod.
 */
const intervencionEntradaSchema = z.object({
  rol: z.string().min(1),
  texto: z.string().trim().min(1),
});

export const registrarLlamadaSchema = z.object({
  agenteId: z.string().trim().min(1),
  fechaInicio: z.string().datetime().optional(),
  transcripcion: z.array(intervencionEntradaSchema).min(1),
});

export type CuerpoRegistrarLlamada = z.infer<typeof registrarLlamadaSchema>;

/**
 * Traduce el cuerpo ya validado a un comando del caso de uso, convirtiendo la fecha
 * ISO a un objeto Date. El contrato externo habla de `transcripcion`; el comando del
 * caso de uso lo hace de `intervenciones` (lenguaje de la aplicación), de modo que la
 * traducción ocurre aquí, en la frontera. La propiedad opcional se omite por completo
 * cuando no llega (coherente con exactOptionalPropertyTypes).
 */
export function aComandoRegistrarLlamada(cuerpo: CuerpoRegistrarLlamada): ComandoRegistrarLlamada {
  const base = {
    agenteId: cuerpo.agenteId,
    intervenciones: cuerpo.transcripcion,
  };
  return cuerpo.fechaInicio === undefined
    ? base
    : { ...base, fechaInicio: new Date(cuerpo.fechaInicio) };
}
