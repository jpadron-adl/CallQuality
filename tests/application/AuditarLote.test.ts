import { describe, it, expect, beforeEach } from 'vitest';
import { AuditarLote } from '@application/use-cases/AuditarLote';
import { AuditarLlamada } from '@application/use-cases/AuditarLlamada';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import type { AnalisisIaService, ResultadoAnalisis } from '@domain/auditoria/ports/AnalisisIaService';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';
import type { Reloj } from '@domain/shared/ports/Reloj';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

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
  async listarPorAgente(agenteId: string): Promise<Llamada[]> {
    return [...this.llamadas.values()].filter((llamada) => llamada.agenteId === agenteId);
  }
}

class AuditoriaRepositoryEnMemoria implements AuditoriaRepository {
  private readonly porId = new Map<string, ResultadoAuditoria>();
  sembrar(resultado: ResultadoAuditoria): void {
    this.porId.set(resultado.id.valor, resultado);
  }
  async guardar(resultado: ResultadoAuditoria): Promise<void> {
    this.porId.set(resultado.id.valor, resultado);
  }
  async obtenerPorId(id: AuditoriaId): Promise<ResultadoAuditoria | null> {
    return this.porId.get(id.valor) ?? null;
  }
  async obtenerPorLlamada(id: LlamadaId): Promise<ResultadoAuditoria[]> {
    return [...this.porId.values()].filter((r) => r.llamadaId.esIgualA(id));
  }
}

const cita = Evidencia.crear('Buenos días');

/** Análisis determinista: lanza si la transcripción contiene "FALLA"; en otro caso aprueba el saludo. */
class AnalisisIaStub implements AnalisisIaService {
  async analizarCumplimiento(transcripcion: Transcripcion): Promise<ResultadoAnalisis> {
    const texto = transcripcion.intervenciones.map((i) => i.texto).join(' ');
    if (texto.includes('FALLA')) {
      throw new Error('El análisis de IA ha fallado para esta llamada.');
    }
    return {
      evaluaciones: [EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita)],
      alertas: [],
    };
  }
}

class GeneradorIdSecuencial implements GeneradorId {
  private n = 0;
  siguiente(): string {
    return `aud-${(this.n += 1)}`;
  }
}

class RelojFijo implements Reloj {
  ahora(): Date {
    return new Date('2026-06-27T10:00:00.000Z');
  }
}

const crearLlamada = (id: string, texto = 'Buenos días') =>
  Llamada.crear({
    id: LlamadaId.crear(id),
    agenteId: 'agente-7',
    fechaInicio: new Date('2026-06-20T10:00:00.000Z'),
    transcripcion: Transcripcion.crear([Intervencion.crear(IntervinienteRol.AGENTE, texto)]),
  });

const auditoriaPrevia = (llamadaId: string) =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(`previa-${llamadaId}`),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date('2026-06-21T10:00:00.000Z'),
    evaluaciones: [EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, cita)],
    alertas: [],
  });

describe('AuditarLote', () => {
  let llamadas: LlamadaRepositoryEnMemoria;
  let auditorias: AuditoriaRepositoryEnMemoria;
  let casoDeUso: AuditarLote;

  beforeEach(() => {
    llamadas = new LlamadaRepositoryEnMemoria();
    auditorias = new AuditoriaRepositoryEnMemoria();
    const auditarLlamada = new AuditarLlamada(
      llamadas,
      new AnalisisIaStub(),
      auditorias,
      new GeneradorIdSecuencial(),
      new RelojFijo(),
    );
    casoDeUso = new AuditarLote(llamadas, auditorias, auditarLlamada);
  });

  it('audita solo las llamadas que no tienen auditoría previa', async () => {
    llamadas.sembrar(crearLlamada('llamada-1'));
    llamadas.sembrar(crearLlamada('llamada-2'));
    llamadas.sembrar(crearLlamada('llamada-3'));
    auditorias.sembrar(auditoriaPrevia('llamada-2')); // ya auditada: debe omitirse

    const resumen = await casoDeUso.ejecutar();

    expect(resumen.totalPendientes).toBe(2);
    expect(resumen.auditadas).toBe(2);
    expect(resumen.fallidas).toBe(0);
    // la llamada ya auditada conserva una sola auditoría (no se re-audita)
    expect(await auditorias.obtenerPorLlamada(LlamadaId.crear('llamada-2'))).toHaveLength(1);
  });

  it('es resiliente: una llamada que falla no impide auditar el resto y se reporta', async () => {
    llamadas.sembrar(crearLlamada('llamada-1'));
    llamadas.sembrar(crearLlamada('llamada-2', 'FALLA'));

    const resumen = await casoDeUso.ejecutar();

    expect(resumen.totalPendientes).toBe(2);
    expect(resumen.auditadas).toBe(1);
    expect(resumen.fallidas).toBe(1);
    expect(resumen.fallos).toHaveLength(1);
    expect(resumen.fallos[0]?.llamadaId).toBe('llamada-2');
    expect(resumen.fallos[0]?.motivo).toMatch(/ha fallado/i);
  });

  it('devuelve un resumen vacío cuando no hay llamadas pendientes', async () => {
    llamadas.sembrar(crearLlamada('llamada-1'));
    auditorias.sembrar(auditoriaPrevia('llamada-1'));

    const resumen = await casoDeUso.ejecutar();

    expect(resumen.totalPendientes).toBe(0);
    expect(resumen.auditadas).toBe(0);
    expect(resumen.fallidas).toBe(0);
    expect(resumen.resultados).toEqual([]);
  });
});
