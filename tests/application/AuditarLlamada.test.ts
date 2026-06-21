import { describe, it, expect, beforeEach } from 'vitest';
import { AuditarLlamada } from '@application/use-cases/AuditarLlamada';
import { LlamadaNoEncontradaError } from '@application/shared/LlamadaNoEncontradaError';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { AnalisisIaService, ResultadoAnalisis } from '@domain/auditoria/ports/AnalisisIaService';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';

// --- Stubs en memoria (hechos a mano, sin librerías de mocking) ---

class LlamadaRepositoryEnMemoria implements LlamadaRepository {
  private readonly llamadas = new Map<string, Llamada>();
  sembrar(llamada: Llamada): void {
    this.llamadas.set(llamada.id.valor, llamada);
  }
  async obtenerPorId(id: LlamadaId): Promise<Llamada | null> {
    return this.llamadas.get(id.valor) ?? null;
  }
  async guardar(llamada: Llamada): Promise<void> {
    this.llamadas.set(llamada.id.valor, llamada);
  }
  async listarPendientesDeAuditar(): Promise<Llamada[]> {
    return [...this.llamadas.values()];
  }
}

class AuditoriaRepositoryEnMemoria implements AuditoriaRepository {
  readonly guardados: ResultadoAuditoria[] = [];
  async guardar(resultado: ResultadoAuditoria): Promise<void> {
    this.guardados.push(resultado);
  }
  async obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]> {
    return this.guardados.filter((r) => r.llamadaId.esIgualA(id));
  }
}

class AnalisisIaServiceStub implements AnalisisIaService {
  protocolosRecibidos: TipoProtocolo[] = [];
  constructor(private readonly respuesta: ResultadoAnalisis) {}
  async analizarCumplimiento(_t: Transcripcion, protocolos: TipoProtocolo[]): Promise<ResultadoAnalisis> {
    this.protocolosRecibidos = protocolos;
    return this.respuesta;
  }
}

class GeneradorIdStub implements GeneradorId {
  constructor(private readonly id: string) {}
  siguiente(): string {
    return this.id;
  }
}

// --- Datos de apoyo ---

const cita = Evidencia.crear('cita');
const evaluacion = (tipo: TipoProtocolo, cumplido: boolean) => EvaluacionProtocolo.crear(tipo, cumplido, cita);

const crearLlamada = (id = 'llamada-001') =>
  Llamada.crear({
    id: LlamadaId.crear(id),
    agenteId: 'agente-007',
    fechaInicio: new Date('2026-06-21T10:00:00.000Z'),
    transcripcion: Transcripcion.crear([Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días')]),
  });

const respuestaIaPorDefecto: ResultadoAnalisis = {
  evaluaciones: [
    evaluacion(TipoProtocolo.SALUDO_INICIAL, true),
    evaluacion(TipoProtocolo.VALIDACION_IDENTIDAD, true),
    evaluacion(TipoProtocolo.OFERTA_OBLIGATORIA, false),
    evaluacion(TipoProtocolo.DESPEDIDA, false),
  ],
  alertas: [],
};

describe('AuditarLlamada', () => {
  let llamadas: LlamadaRepositoryEnMemoria;
  let auditorias: AuditoriaRepositoryEnMemoria;
  let ia: AnalisisIaServiceStub;
  let generador: GeneradorIdStub;
  let casoDeUso: AuditarLlamada;

  beforeEach(() => {
    llamadas = new LlamadaRepositoryEnMemoria();
    auditorias = new AuditoriaRepositoryEnMemoria();
    ia = new AnalisisIaServiceStub(respuestaIaPorDefecto);
    generador = new GeneradorIdStub('auditoria-fija');
    casoDeUso = new AuditarLlamada(llamadas, ia, auditorias, generador);
    llamadas.sembrar(crearLlamada());
  });

  it('audita una llamada existente y devuelve el resultado con su identidad generada', async () => {
    const resultado = await casoDeUso.ejecutar(LlamadaId.crear('llamada-001'));
    expect(resultado.id.valor).toBe('auditoria-fija');
    expect(resultado.llamadaId.valor).toBe('llamada-001');
  });

  it('delega en el dominio el cálculo de la puntuación', async () => {
    const resultado = await casoDeUso.ejecutar(LlamadaId.crear('llamada-001'));
    expect(resultado.puntuacion().valor).toBe(50);
  });

  it('persiste el resultado mediante el repositorio de auditorías', async () => {
    const resultado = await casoDeUso.ejecutar(LlamadaId.crear('llamada-001'));
    expect(auditorias.guardados).toHaveLength(1);
    expect(auditorias.guardados[0]?.esIgualA(resultado)).toBe(true);
  });

  it('solicita al servicio de IA el análisis de todos los protocolos auditables', async () => {
    await casoDeUso.ejecutar(LlamadaId.crear('llamada-001'));
    expect(ia.protocolosRecibidos).toHaveLength(TipoProtocolo.todos().length);
  });

  it('lanza LlamadaNoEncontradaError si la llamada no existe', async () => {
    await expect(casoDeUso.ejecutar(LlamadaId.crear('inexistente'))).rejects.toThrow(
      LlamadaNoEncontradaError,
    );
  });
});
