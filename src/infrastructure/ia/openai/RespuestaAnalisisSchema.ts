import { z } from 'zod';

/**
 * Esquema Zod de la respuesta CRUDA del LLM (anti-no-determinismo).
 * Valida únicamente la forma sintáctica de la respuesta; la pertenencia de los
 * valores a los catálogos del dominio (TipoProtocolo, TipoAlerta, SeveridadAlerta)
 * se delega en los propios value objects al traducir.
 */
const evaluacionCrudaSchema = z.object({
  protocolo: z.string().min(1),
  cumplido: z.boolean(),
  evidencia: z.string().trim().min(1),
});

const alertaCrudaSchema = z.object({
  tipo: z.string().min(1),
  severidad: z.string().min(1),
  evidencia: z.string().trim().min(1),
});

export const respuestaAnalisisSchema = z.object({
  evaluaciones: z.array(evaluacionCrudaSchema),
  alertas: z.array(alertaCrudaSchema),
});

export type RespuestaAnalisisCruda = z.infer<typeof respuestaAnalisisSchema>;
