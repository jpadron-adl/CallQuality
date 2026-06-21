import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '@infrastructure/config/AppConfig';
import { AdaptadorNoDisponibleError } from '@infrastructure/config/AdaptadorNoDisponibleError';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { AuditarLlamada } from '@application/use-cases/AuditarLlamada';
import { MockAnalisisService } from '@infrastructure/ia/MockAnalisisService';
import { LlamadaRepositoryEnMemoria } from '@infrastructure/persistence/LlamadaRepositoryEnMemoria';
import { AuditoriaRepositoryEnMemoria } from '@infrastructure/persistence/AuditoriaRepositoryEnMemoria';
import { GeneradorIdUuid } from '@infrastructure/id/GeneradorIdUuid';
import { CargadorLlamadasSinteticas } from '@infrastructure/data/CargadorLlamadasSinteticas';

/**
 * Contexto de aplicación ya cableado: expone el caso de uso y los repositorios
 * con sus adaptadores concretos inyectados.
 */
export interface ContextoAplicacion {
  readonly auditarLlamada: AuditarLlamada;
  readonly llamadas: LlamadaRepository;
  readonly auditorias: AuditoriaRepository;
}

const RUTA_DATOS_DEMO = fileURLToPath(new URL('../data/llamadas-demo.json', import.meta.url));

/**
 * Composite Root: ensambla las dependencias según el modo de operación.
 * El dominio y la aplicación nunca conocen estas decisiones; aquí es el único
 * lugar donde se eligen los adaptadores concretos.
 */
export function construirContexto(config: AppConfig): ContextoAplicacion {
  if (config.modo === 'production') {
    throw new AdaptadorNoDisponibleError(
      'El adaptador de análisis por IA en modo producción (SDK de OpenAI) aún no está implementado.',
    );
  }

  // Modo demo: todo en memoria, sin API keys.
  const datosCrudos: unknown = JSON.parse(readFileSync(RUTA_DATOS_DEMO, 'utf-8'));
  const llamadasSinteticas = new CargadorLlamadasSinteticas().mapear(datosCrudos);

  const llamadas = new LlamadaRepositoryEnMemoria(llamadasSinteticas);
  const auditorias = new AuditoriaRepositoryEnMemoria();
  const auditarLlamada = new AuditarLlamada(
    llamadas,
    new MockAnalisisService(),
    auditorias,
    new GeneradorIdUuid(),
  );

  return { auditarLlamada, llamadas, auditorias };
}
