import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '@infrastructure/config/AppConfig';
import type { AnalisisIaService } from '@domain/auditoria/ports/AnalisisIaService';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { AuditarLlamada } from '@application/use-cases/AuditarLlamada';
import { MockAnalisisService } from '@infrastructure/ia/MockAnalisisService';
import { OpenAiAnalisisService } from '@infrastructure/ia/openai/OpenAiAnalisisService';
import { OpenAiChatCompletions } from '@infrastructure/ia/openai/OpenAiChatCompletions';
import { LlamadaRepositoryEnMemoria } from '@infrastructure/persistence/LlamadaRepositoryEnMemoria';
import { AuditoriaRepositoryEnMemoria } from '@infrastructure/persistence/AuditoriaRepositoryEnMemoria';
import { GeneradorIdUuid } from '@infrastructure/id/GeneradorIdUuid';
import { RelojDelSistema } from '@infrastructure/tiempo/RelojDelSistema';
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
  // El servicio de análisis es lo único que cambia según el modo. La persistencia
  // real es un hito posterior; por ahora ambos modos se siembran con las llamadas
  // sintéticas en memoria, de modo que el flujo es ejecutable de extremo a extremo.
  const datosCrudos: unknown = JSON.parse(readFileSync(RUTA_DATOS_DEMO, 'utf-8'));
  const llamadasSinteticas = new CargadorLlamadasSinteticas().mapear(datosCrudos);

  const llamadas = new LlamadaRepositoryEnMemoria(llamadasSinteticas);
  const auditorias = new AuditoriaRepositoryEnMemoria();
  const auditarLlamada = new AuditarLlamada(
    llamadas,
    construirAnalisis(config),
    auditorias,
    new GeneradorIdUuid(),
    new RelojDelSistema(),
  );

  return { auditarLlamada, llamadas, auditorias };
}

/** Selecciona el adaptador de análisis concreto según el modo de operación. */
function construirAnalisis(config: AppConfig): AnalisisIaService {
  if (config.modo === 'production') {
    // leerConfig garantiza la presencia de openai en modo producción.
    return new OpenAiAnalisisService(new OpenAiChatCompletions(config.openai!));
  }
  return new MockAnalisisService();
}
