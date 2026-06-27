import { DomainError } from '@domain/shared/DomainError';
import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';

/** Protocolo cuyo veredicto efectivo cambió entre las dos auditorías comparadas.
 * `cumplidoA`/`cumplidoB` valen `null` si el protocolo no se evaluó en esa auditoría. */
export interface ProtocoloCambiado {
  readonly protocolo: string;
  readonly cumplidoA: boolean | null;
  readonly cumplidoB: boolean | null;
}

/** Alerta presente en solo una de las auditorías (aparecida o desaparecida). */
export interface AlertaComparada {
  readonly tipo: string;
  readonly severidad: string;
}

/**
 * Read-model que contrasta dos auditorías de la MISMA llamada (p. ej. una auditoría y una
 * re-auditoría posterior). No es un agregado con identidad ni se persiste: se calcula bajo
 * demanda. Trabaja sobre la valoración EFECTIVA de cada auditoría (puntuación y evaluaciones
 * tras las correcciones humanas), de modo que la comparación refleja el veredicto vigente.
 */
export class ComparacionAuditorias {
  private constructor(
    private readonly _llamadaId: string,
    private readonly _auditoriaIdA: string,
    private readonly _auditoriaIdB: string,
    private readonly _puntuacionA: number,
    private readonly _puntuacionB: number,
    private readonly _protocolosCambiados: readonly ProtocoloCambiado[],
    private readonly _alertasAparecidas: readonly AlertaComparada[],
    private readonly _alertasDesaparecidas: readonly AlertaComparada[],
  ) {}

  static comparar(a: ResultadoAuditoria, b: ResultadoAuditoria): ComparacionAuditorias {
    if (!a.llamadaId.esIgualA(b.llamadaId)) {
      throw new DomainError(
        'Solo pueden compararse auditorías de la misma llamada.',
      );
    }
    return new ComparacionAuditorias(
      a.llamadaId.valor,
      a.id.valor,
      b.id.valor,
      a.puntuacion().valor,
      b.puntuacion().valor,
      ComparacionAuditorias.protocolosCambiados(a, b),
      ComparacionAuditorias.alertasSoloEn(b, a),
      ComparacionAuditorias.alertasSoloEn(a, b),
    );
  }

  /** Veredictos efectivos por tipo de protocolo cuyo cumplimiento difiere entre A y B. */
  private static protocolosCambiados(
    a: ResultadoAuditoria,
    b: ResultadoAuditoria,
  ): ProtocoloCambiado[] {
    const veredictosA = ComparacionAuditorias.veredictosPorProtocolo(a);
    const veredictosB = ComparacionAuditorias.veredictosPorProtocolo(b);
    const protocolos = new Set([...veredictosA.keys(), ...veredictosB.keys()]);
    const cambiados: ProtocoloCambiado[] = [];
    for (const protocolo of protocolos) {
      const cumplidoA = veredictosA.get(protocolo) ?? null;
      const cumplidoB = veredictosB.get(protocolo) ?? null;
      if (cumplidoA !== cumplidoB) {
        cambiados.push({ protocolo, cumplidoA, cumplidoB });
      }
    }
    return cambiados.sort((x, y) => x.protocolo.localeCompare(y.protocolo));
  }

  private static veredictosPorProtocolo(
    auditoria: ResultadoAuditoria,
  ): Map<string, boolean> {
    const veredictos = new Map<string, boolean>();
    for (const evaluacion of auditoria.evaluacionesEfectivas()) {
      veredictos.set(evaluacion.tipo.valor, evaluacion.cumplido);
    }
    return veredictos;
  }

  /** Alertas (por tipo) presentes en `origen` pero ausentes en `otra`. */
  private static alertasSoloEn(
    origen: ResultadoAuditoria,
    otra: ResultadoAuditoria,
  ): AlertaComparada[] {
    const tiposEnOtra = new Set(otra.alertas.map((alerta) => alerta.tipo.valor));
    return origen.alertas
      .filter((alerta) => !tiposEnOtra.has(alerta.tipo.valor))
      .map((alerta) => ({ tipo: alerta.tipo.valor, severidad: alerta.severidad.valor }))
      .sort((x, y) => x.tipo.localeCompare(y.tipo));
  }

  get llamadaId(): string {
    return this._llamadaId;
  }

  get auditoriaIdA(): string {
    return this._auditoriaIdA;
  }

  get auditoriaIdB(): string {
    return this._auditoriaIdB;
  }

  get puntuacionA(): number {
    return this._puntuacionA;
  }

  get puntuacionB(): number {
    return this._puntuacionB;
  }

  get diferenciaPuntuacion(): number {
    return this._puntuacionB - this._puntuacionA;
  }

  get protocolosCambiados(): ProtocoloCambiado[] {
    return [...this._protocolosCambiados];
  }

  get alertasAparecidas(): AlertaComparada[] {
    return [...this._alertasAparecidas];
  }

  get alertasDesaparecidas(): AlertaComparada[] {
    return [...this._alertasDesaparecidas];
  }
}
