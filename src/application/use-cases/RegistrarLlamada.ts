import type { LlamadaRepository } from '@domain/llamada/ports/LlamadaRepository';
import type { GeneradorId } from '@domain/shared/ports/GeneradorId';
import type { Reloj } from '@domain/shared/ports/Reloj';
import { Llamada } from '@domain/llamada/Llamada';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';

/** Datos de un turno de la transcripción tal y como entran al caso de uso. */
export interface IntervencionEntrada {
  readonly rol: string;
  readonly texto: string;
}

/**
 * Comando de entrada para registrar una llamada a partir de una transcripción ya
 * textual y diarizada (rol + texto por turno). La fecha de inicio es opcional: si no
 * se aporta, el caso de uso la toma del reloj (instante del alta).
 */
export interface ComandoRegistrarLlamada {
  readonly agenteId: string;
  readonly intervenciones: readonly IntervencionEntrada[];
  readonly fechaInicio?: Date;
}

/**
 * Caso de uso: registra una nueva llamada en el sistema a partir de su transcripción.
 * Orquesta el dominio y los puertos (repositorio, generador de id y reloj) sin conocer
 * ninguna tecnología concreta. Las invariantes (roles válidos, textos no vacíos, al
 * menos una intervención) las garantiza el dominio al construir los value objects.
 */
export class RegistrarLlamada {
  constructor(
    private readonly llamadas: LlamadaRepository,
    private readonly generadorId: GeneradorId,
    private readonly reloj: Reloj,
  ) {}

  async ejecutar(comando: ComandoRegistrarLlamada): Promise<Llamada> {
    const intervenciones = comando.intervenciones.map((entrada) =>
      Intervencion.crear(IntervinienteRol.desde(entrada.rol), entrada.texto),
    );
    const transcripcion = Transcripcion.crear(intervenciones);

    const llamada = Llamada.crear({
      id: LlamadaId.crear(this.generadorId.siguiente()),
      agenteId: comando.agenteId,
      fechaInicio: comando.fechaInicio ?? this.reloj.ahora(),
      transcripcion,
    });

    await this.llamadas.guardar(llamada);
    return llamada;
  }
}
