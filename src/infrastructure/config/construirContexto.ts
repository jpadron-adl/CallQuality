import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from '@infrastructure/config/AppConfig';
import type { AnalisisIaService } from '@domain/auditoria/ports/AnalisisIaService';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { Llamada } from '@domain/llamada/Llamada';
import { AuditarLlamada } from '@application/use-cases/AuditarLlamada';
import { RegistrarLlamada } from '@application/use-cases/RegistrarLlamada';
import { RevisarAuditoria } from '@application/use-cases/RevisarAuditoria';
import { MockAnalisisService } from '@infrastructure/ia/MockAnalisisService';
import { OpenAiAnalisisService } from '@infrastructure/ia/openai/OpenAiAnalisisService';
import { OpenAiChatCompletions } from '@infrastructure/ia/openai/OpenAiChatCompletions';
import { LlamadaRepositoryEnMemoria } from '@infrastructure/persistence/LlamadaRepositoryEnMemoria';
import { AuditoriaRepositoryEnMemoria } from '@infrastructure/persistence/AuditoriaRepositoryEnMemoria';
import { LlamadaRepositorySqlite } from '@infrastructure/persistence/sqlite/LlamadaRepositorySqlite';
import { AuditoriaRepositorySqlite } from '@infrastructure/persistence/sqlite/AuditoriaRepositorySqlite';
import { abrirBaseDatosSqlite } from '@infrastructure/persistence/sqlite/AbrirBaseDatosSqlite';
import { GeneradorIdUuid } from '@infrastructure/id/GeneradorIdUuid';
import { RelojDelSistema } from '@infrastructure/tiempo/RelojDelSistema';
import { CargadorLlamadasSinteticas } from '@infrastructure/data/CargadorLlamadasSinteticas';

/**
 * Contexto de aplicación ya cableado: expone el caso de uso y los repositorios
 * con sus adaptadores concretos inyectados.
 */
export interface ContextoAplicacion {
  readonly auditarLlamada: AuditarLlamada;
  readonly registrarLlamada: RegistrarLlamada;
  readonly revisarAuditoria: RevisarAuditoria;
  readonly llamadas: LlamadaRepository;
  readonly auditorias: AuditoriaRepository;
}

const RUTA_DATOS_DEMO = fileURLToPath(new URL('../data/llamadas-demo.json', import.meta.url));
const DB_PATH_POR_DEFECTO = 'callquality.sqlite';

/**
 * Composite Root: ensambla las dependencias según el modo de operación y la
 * tecnología de persistencia. El dominio y la aplicación nunca conocen estas
 * decisiones; aquí es el único lugar donde se eligen los adaptadores concretos.
 */
export function construirContexto(config: AppConfig): ContextoAplicacion {
  const llamadasSinteticas = cargarLlamadasSinteticas();
  const { llamadas, auditorias } = construirRepositorios(config, llamadasSinteticas);
  const generadorId = new GeneradorIdUuid();
  const reloj = new RelojDelSistema();

  const auditarLlamada = new AuditarLlamada(
    llamadas,
    construirAnalisis(config),
    auditorias,
    generadorId,
    reloj,
  );
  const registrarLlamada = new RegistrarLlamada(llamadas, generadorId, reloj);
  const revisarAuditoria = new RevisarAuditoria(auditorias, reloj);

  return { auditarLlamada, registrarLlamada, revisarAuditoria, llamadas, auditorias };
}

/** Selecciona los adaptadores de persistencia concretos según la configuración. */
function construirRepositorios(
  config: AppConfig,
  llamadasSinteticas: readonly Llamada[],
): { llamadas: LlamadaRepository; auditorias: AuditoriaRepository } {
  if (config.persistencia === 'sqlite') {
    const db = abrirBaseDatosSqlite(config.dbPath ?? DB_PATH_POR_DEFECTO);
    const llamadas = new LlamadaRepositorySqlite(db);
    const auditorias = new AuditoriaRepositorySqlite(db);
    sembrarLlamadasSiVacia(db, llamadas, llamadasSinteticas);
    return { llamadas, auditorias };
  }

  // Persistencia en memoria (por defecto): estado efímero entre arranques.
  return {
    llamadas: new LlamadaRepositoryEnMemoria(llamadasSinteticas),
    auditorias: new AuditoriaRepositoryEnMemoria(),
  };
}

/**
 * Siembra las llamadas sintéticas solo si el almacén está vacío (primer arranque),
 * de modo que las auditorías acumuladas en ejecuciones previas se conservan.
 * node:sqlite es síncrono: el INSERT del repositorio se ejecuta antes de devolver
 * la promesa, por lo que la siembra es efectiva sin necesidad de await.
 */
function sembrarLlamadasSiVacia(
  db: import('node:sqlite').DatabaseSync,
  llamadas: LlamadaRepository,
  llamadasSinteticas: readonly Llamada[],
): void {
  const fila = db.prepare('SELECT COUNT(*) AS n FROM llamadas').get() as { n: number };
  if (fila.n === 0) {
    for (const llamada of llamadasSinteticas) {
      void llamadas.guardar(llamada);
    }
  }
}

/** Carga y mapea las llamadas sintéticas del JSON local a agregados del dominio. */
function cargarLlamadasSinteticas(): Llamada[] {
  const datosCrudos: unknown = JSON.parse(readFileSync(RUTA_DATOS_DEMO, 'utf-8'));
  return new CargadorLlamadasSinteticas().mapear(datosCrudos);
}

/** Selecciona el adaptador de análisis concreto según el modo de operación. */
function construirAnalisis(config: AppConfig): AnalisisIaService {
  if (config.modo === 'production') {
    // leerConfig garantiza la presencia de openai en modo producción.
    return new OpenAiAnalisisService(new OpenAiChatCompletions(config.openai!));
  }
  return new MockAnalisisService();
}
