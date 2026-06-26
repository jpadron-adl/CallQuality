import type { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';

/** Recuento de cumplimiento de un protocolo en el informe de un agente. */
export interface ProtocoloIncumplido {
  readonly protocolo: string;
  readonly incumplimientos: number;
  readonly evaluaciones: number;
}

/** Recuento de alertas por severidad en el informe de un agente. */
export interface AlertasPorSeveridad {
  readonly severidad: string;
  readonly total: number;
}

/**
 * Read-model con el desempeño de un agente, derivado de sus auditorías. No es un agregado
 * con identidad ni se persiste: se calcula bajo demanda a partir de las auditorías del agente.
 * Para que el informe refleje la valoración vigente, considera únicamente la auditoría más
 * reciente de cada llamada (descarta re-auditorías anteriores) y usa la puntuación efectiva,
 * de modo que las correcciones humanas quedan incorporadas.
 */
export class InformeAgente {
  private constructor(
    private readonly _agenteId: string,
    private readonly _numeroLlamadasAuditadas: number,
    private readonly _puntuacionMedia: number,
    private readonly _protocolosMasIncumplidos: readonly ProtocoloIncumplido[],
    private readonly _totalAlertas: number,
    private readonly _alertasPorSeveridad: readonly AlertasPorSeveridad[],
  ) {}

  static generar(agenteId: string, auditorias: readonly ResultadoAuditoria[]): InformeAgente {
    const vigentes = InformeAgente.auditoriasVigentes(auditorias);

    const puntuacionMedia =
      vigentes.length === 0
        ? 0
        : Math.round(
            vigentes.reduce((suma, auditoria) => suma + auditoria.puntuacion().valor, 0) /
              vigentes.length,
          );

    return new InformeAgente(
      agenteId,
      vigentes.length,
      puntuacionMedia,
      InformeAgente.protocolosMasIncumplidos(vigentes),
      vigentes.reduce((suma, auditoria) => suma + auditoria.alertas.length, 0),
      InformeAgente.alertasPorSeveridad(vigentes),
    );
  }

  /** Conserva, por cada llamada, solo la auditoría con la fecha más reciente. */
  private static auditoriasVigentes(
    auditorias: readonly ResultadoAuditoria[],
  ): ResultadoAuditoria[] {
    const porLlamada = new Map<string, ResultadoAuditoria>();
    for (const auditoria of auditorias) {
      const vigente = porLlamada.get(auditoria.llamadaId.valor);
      if (
        vigente === undefined ||
        auditoria.fechaAuditoria.getTime() > vigente.fechaAuditoria.getTime()
      ) {
        porLlamada.set(auditoria.llamadaId.valor, auditoria);
      }
    }
    return [...porLlamada.values()];
  }

  private static protocolosMasIncumplidos(
    vigentes: readonly ResultadoAuditoria[],
  ): ProtocoloIncumplido[] {
    const acumulado = new Map<string, { incumplimientos: number; evaluaciones: number }>();
    for (const auditoria of vigentes) {
      for (const evaluacion of auditoria.evaluacionesEfectivas()) {
        const clave = evaluacion.tipo.valor;
        const actual = acumulado.get(clave) ?? { incumplimientos: 0, evaluaciones: 0 };
        acumulado.set(clave, {
          incumplimientos: actual.incumplimientos + (evaluacion.cumplido ? 0 : 1),
          evaluaciones: actual.evaluaciones + 1,
        });
      }
    }
    return [...acumulado.entries()]
      .map(([protocolo, conteo]) => ({ protocolo, ...conteo }))
      .sort((a, b) => b.incumplimientos - a.incumplimientos || a.protocolo.localeCompare(b.protocolo));
  }

  private static alertasPorSeveridad(
    vigentes: readonly ResultadoAuditoria[],
  ): AlertasPorSeveridad[] {
    const acumulado = new Map<string, number>();
    for (const auditoria of vigentes) {
      for (const alerta of auditoria.alertas) {
        const clave = alerta.severidad.valor;
        acumulado.set(clave, (acumulado.get(clave) ?? 0) + 1);
      }
    }
    return [...acumulado.entries()]
      .map(([severidad, total]) => ({ severidad, total }))
      .sort((a, b) => a.severidad.localeCompare(b.severidad));
  }

  get agenteId(): string {
    return this._agenteId;
  }

  get numeroLlamadasAuditadas(): number {
    return this._numeroLlamadasAuditadas;
  }

  get puntuacionMedia(): number {
    return this._puntuacionMedia;
  }

  get protocolosMasIncumplidos(): ProtocoloIncumplido[] {
    return [...this._protocolosMasIncumplidos];
  }

  get totalAlertas(): number {
    return this._totalAlertas;
  }

  get alertasPorSeveridad(): AlertasPorSeveridad[] {
    return [...this._alertasPorSeveridad];
  }
}
