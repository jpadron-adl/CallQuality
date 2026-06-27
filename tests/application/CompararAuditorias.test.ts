import { describe, it, expect, beforeEach } from 'vitest';
import { CompararAuditorias } from '@application/use-cases/CompararAuditorias';
import { AuditoriaNoEncontradaError } from '@application/shared/AuditoriaNoEncontradaError';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

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

const crearAuditoria = (id: string, llamadaId: string, cumplido: boolean) =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear(id),
    llamadaId: LlamadaId.crear(llamadaId),
    fechaAuditoria: new Date('2026-06-21T10:00:00.000Z'),
    evaluaciones: [EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, cumplido, cita)],
    alertas: [],
  });

describe('CompararAuditorias', () => {
  let auditorias: AuditoriaRepositoryEnMemoria;
  let casoDeUso: CompararAuditorias;

  beforeEach(() => {
    auditorias = new AuditoriaRepositoryEnMemoria();
    casoDeUso = new CompararAuditorias(auditorias);
  });

  it('compara dos auditorías existentes de la misma llamada', async () => {
    auditorias.sembrar(crearAuditoria('a1', 'llamada-1', false));
    auditorias.sembrar(crearAuditoria('a2', 'llamada-1', true));

    const comparacion = await casoDeUso.ejecutar('a1', 'a2');

    expect(comparacion.auditoriaIdA).toBe('a1');
    expect(comparacion.auditoriaIdB).toBe('a2');
    expect(comparacion.puntuacionA).toBe(0);
    expect(comparacion.puntuacionB).toBe(100);
    expect(comparacion.diferenciaPuntuacion).toBe(100);
  });

  it('falla si la primera auditoría no existe', async () => {
    auditorias.sembrar(crearAuditoria('a2', 'llamada-1', true));
    await expect(casoDeUso.ejecutar('inexistente', 'a2')).rejects.toThrow(
      AuditoriaNoEncontradaError,
    );
  });

  it('falla si la segunda auditoría no existe', async () => {
    auditorias.sembrar(crearAuditoria('a1', 'llamada-1', true));
    await expect(casoDeUso.ejecutar('a1', 'inexistente')).rejects.toThrow(
      AuditoriaNoEncontradaError,
    );
  });
});
