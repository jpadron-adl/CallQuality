import { describe, it, expect, beforeEach } from 'vitest';
import { GenerarInformeAgente } from '@application/use-cases/GenerarInformeAgente';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
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

const cita = Evidencia.crear('cita');

const crearLlamada = (id: string, agenteId: string) =>
  Llamada.crear({
    id: LlamadaId.crear(id),
    agenteId,
    fechaInicio: new Date('2026-06-20T10:00:00.000Z'),
    transcripcion: Transcripcion.crear([Intervencion.crear(IntervinienteRol.AGENTE, 'Buenos días')]),
  });

const crearAuditoria = (id: string, llamadaId: string, cumplido: boolean) =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(id),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date('2026-06-21T10:00:00.000Z'),
    evaluaciones: [EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, cumplido, cita)],
    alertas: [],
  });

describe('GenerarInformeAgente', () => {
  let llamadas: LlamadaRepositoryEnMemoria;
  let auditorias: AuditoriaRepositoryEnMemoria;
  let casoDeUso: GenerarInformeAgente;

  beforeEach(() => {
    llamadas = new LlamadaRepositoryEnMemoria();
    auditorias = new AuditoriaRepositoryEnMemoria();
    casoDeUso = new GenerarInformeAgente(llamadas, auditorias);
  });

  it('agrega las auditorías de las llamadas del agente en un informe', async () => {
    llamadas.sembrar(crearLlamada('llamada-1', 'agente-7'));
    llamadas.sembrar(crearLlamada('llamada-2', 'agente-7'));
    auditorias.sembrar(crearAuditoria('a1', 'llamada-1', true));
    auditorias.sembrar(crearAuditoria('a2', 'llamada-2', false));

    const informe = await casoDeUso.ejecutar('agente-7');

    expect(informe.agenteId).toBe('agente-7');
    expect(informe.numeroLlamadasAuditadas).toBe(2);
    expect(informe.puntuacionMedia).toBe(50);
  });

  it('no cuenta las llamadas del agente que aún no tienen auditorías', async () => {
    llamadas.sembrar(crearLlamada('llamada-1', 'agente-7'));
    llamadas.sembrar(crearLlamada('llamada-2', 'agente-7'));
    auditorias.sembrar(crearAuditoria('a1', 'llamada-1', true));

    const informe = await casoDeUso.ejecutar('agente-7');

    expect(informe.numeroLlamadasAuditadas).toBe(1);
  });

  it('aísla el informe a las llamadas del agente solicitado', async () => {
    llamadas.sembrar(crearLlamada('llamada-1', 'agente-7'));
    llamadas.sembrar(crearLlamada('llamada-9', 'agente-99'));
    auditorias.sembrar(crearAuditoria('a1', 'llamada-1', true));
    auditorias.sembrar(crearAuditoria('a9', 'llamada-9', false));

    const informe = await casoDeUso.ejecutar('agente-7');

    expect(informe.numeroLlamadasAuditadas).toBe(1);
    expect(informe.puntuacionMedia).toBe(100);
  });
});
