import { describe, it, expect, beforeEach } from 'vitest';
import { RevisarAuditoria } from '@application/use-cases/RevisarAuditoria';
import { AuditoriaNoEncontradaError } from '@application/shared/AuditoriaNoEncontradaError';
import type { AuditoriaRepository } from '@domain/auditoria/ports/AuditoriaRepository';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { DomainError } from '@domain/shared/DomainError';
import type { Reloj } from '@domain/shared/ports/Reloj';

// --- Stubs en memoria (hechos a mano) ---

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
  get guardados(): ResultadoAuditoria[] {
    return [...this.porId.values()];
  }
}

class RelojFijo implements Reloj {
  constructor(private readonly instante: Date) {}
  ahora(): Date {
    return new Date(this.instante.getTime());
  }
}

const cita = Evidencia.crear('cita');
const evaluacion = (tipo: TipoProtocolo, cumplido: boolean) =>
  EvaluacionProtocolo.crear(tipo, cumplido, cita);

const crearAuditoria = () =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear('auditoria-001'),
    llamadaId: LlamadaId.crear('llamada-001'),
    fechaAuditoria: new Date('2026-06-23T12:00:00.000Z'),
    evaluaciones: [
      evaluacion(TipoProtocolo.SALUDO_INICIAL, true),
      evaluacion(TipoProtocolo.DESPEDIDA, false),
    ],
    alertas: [],
  });

describe('RevisarAuditoria', () => {
  let auditorias: AuditoriaRepositoryEnMemoria;
  let reloj: RelojFijo;
  let casoDeUso: RevisarAuditoria;

  const INSTANTE_REVISION = new Date('2026-06-26T10:00:00.000Z');

  beforeEach(() => {
    auditorias = new AuditoriaRepositoryEnMemoria();
    reloj = new RelojFijo(INSTANTE_REVISION);
    casoDeUso = new RevisarAuditoria(auditorias, reloj);
    auditorias.sembrar(crearAuditoria());
  });

  it('marca la auditoría como revisada por el revisor y comentario indicados', async () => {
    const resultado = await casoDeUso.ejecutar({
      auditoriaId: 'auditoria-001',
      revisor: 'supervisor-01',
      comentario: 'Conforme.',
    });
    expect(resultado.estaRevisada()).toBe(true);
    expect(resultado.revision?.revisor).toBe('supervisor-01');
    expect(resultado.revision?.comentario).toBe('Conforme.');
  });

  it('sella la revisión con el instante del reloj inyectado', async () => {
    const resultado = await casoDeUso.ejecutar({ auditoriaId: 'auditoria-001', revisor: 'supervisor-01' });
    expect(resultado.revision?.fechaRevision.toISOString()).toBe(INSTANTE_REVISION.toISOString());
  });

  it('aplica las correcciones y recalcula la puntuación', async () => {
    const resultado = await casoDeUso.ejecutar({
      auditoriaId: 'auditoria-001',
      revisor: 'supervisor-01',
      correcciones: [{ protocolo: 'DESPEDIDA', cumplido: true, evidencia: 'Sí se despide al final.' }],
    });
    expect(resultado.puntuacion().valor).toBe(100);
  });

  it('persiste la auditoría revisada sin duplicarla', async () => {
    await casoDeUso.ejecutar({ auditoriaId: 'auditoria-001', revisor: 'supervisor-01' });
    expect(auditorias.guardados).toHaveLength(1);
    expect(auditorias.guardados[0]?.estaRevisada()).toBe(true);
  });

  it('lanza AuditoriaNoEncontradaError si la auditoría no existe', async () => {
    await expect(
      casoDeUso.ejecutar({ auditoriaId: 'inexistente', revisor: 'supervisor-01' }),
    ).rejects.toThrow(AuditoriaNoEncontradaError);
  });

  it('propaga el error de dominio al corregir un protocolo no evaluado', async () => {
    await expect(
      casoDeUso.ejecutar({
        auditoriaId: 'auditoria-001',
        revisor: 'supervisor-01',
        correcciones: [{ protocolo: 'OFERTA_OBLIGATORIA', cumplido: true, evidencia: 'x' }],
      }),
    ).rejects.toThrow(DomainError);
  });
});
