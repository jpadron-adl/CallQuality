import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrarLlamada } from '@application/use-cases/RegistrarLlamada';
import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';
import type { Reloj } from '@domain/shared/ports/Reloj';
import { DomainError } from '@domain/shared/DomainError';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

// --- Stubs en memoria (hechos a mano, sin librerías de mocking) ---

class LlamadaRepositoryEnMemoria implements LlamadaRepository {
  readonly guardadas: Llamada[] = [];
  async obtenerPorId(id: LlamadaId): Promise<Llamada | null> {
    return this.guardadas.find((l) => l.id.esIgualA(id)) ?? null;
  }
  async guardar(llamada: Llamada): Promise<void> {
    this.guardadas.push(llamada);
  }
  async listarPendientesDeAuditar(): Promise<Llamada[]> {
    return [...this.guardadas];
  }
}

class GeneradorIdStub implements GeneradorId {
  constructor(private readonly id: string) {}
  siguiente(): string {
    return this.id;
  }
}

class RelojFijo implements Reloj {
  constructor(private readonly instante: Date) {}
  ahora(): Date {
    return new Date(this.instante.getTime());
  }
}

describe('RegistrarLlamada', () => {
  let llamadas: LlamadaRepositoryEnMemoria;
  let generador: GeneradorIdStub;
  let reloj: RelojFijo;
  let casoDeUso: RegistrarLlamada;

  const INSTANTE_ACTUAL = new Date('2026-06-24T09:00:00.000Z');

  const comandoValido = {
    agenteId: 'agente-007',
    intervenciones: [
      { rol: 'AGENTE', texto: 'Buenos días, ¿en qué puedo ayudarle?' },
      { rol: 'CLIENTE', texto: 'Quería consultar mi factura.' },
    ],
  };

  beforeEach(() => {
    llamadas = new LlamadaRepositoryEnMemoria();
    generador = new GeneradorIdStub('llamada-nueva');
    reloj = new RelojFijo(INSTANTE_ACTUAL);
    casoDeUso = new RegistrarLlamada(llamadas, generador, reloj);
  });

  it('registra una llamada con la identidad generada y la persiste', async () => {
    const llamada = await casoDeUso.ejecutar(comandoValido);
    expect(llamada.id.valor).toBe('llamada-nueva');
    expect(llamada.agenteId).toBe('agente-007');
    expect(llamadas.guardadas).toHaveLength(1);
    expect(llamadas.guardadas[0]?.esIgualA(llamada)).toBe(true);
  });

  it('construye la transcripción con las intervenciones del comando', async () => {
    const llamada = await casoDeUso.ejecutar(comandoValido);
    const intervenciones = llamada.transcripcion.intervenciones;
    expect(intervenciones).toHaveLength(2);
    expect(intervenciones[0]?.rol.esIgualA(IntervinienteRol.AGENTE)).toBe(true);
    expect(intervenciones[1]?.rol.esIgualA(IntervinienteRol.CLIENTE)).toBe(true);
    expect(intervenciones[1]?.texto).toBe('Quería consultar mi factura.');
  });

  it('usa el instante del reloj cuando el comando no aporta fecha de inicio', async () => {
    const llamada = await casoDeUso.ejecutar(comandoValido);
    expect(llamada.fechaInicio.toISOString()).toBe(INSTANTE_ACTUAL.toISOString());
  });

  it('respeta la fecha de inicio aportada explícitamente en el comando', async () => {
    const fechaInicio = new Date('2026-05-10T12:30:00.000Z');
    const llamada = await casoDeUso.ejecutar({ ...comandoValido, fechaInicio });
    expect(llamada.fechaInicio.toISOString()).toBe(fechaInicio.toISOString());
  });

  it('propaga el DomainError del dominio si algún rol no es válido', async () => {
    const comando = {
      agenteId: 'agente-007',
      intervenciones: [{ rol: 'SUPERVISOR', texto: 'Texto cualquiera' }],
    };
    await expect(casoDeUso.ejecutar(comando)).rejects.toThrow(DomainError);
    expect(llamadas.guardadas).toHaveLength(0);
  });

  it('propaga el DomainError si la transcripción no tiene intervenciones', async () => {
    const comando = { agenteId: 'agente-007', intervenciones: [] };
    await expect(casoDeUso.ejecutar(comando)).rejects.toThrow(DomainError);
  });
});
