import { DomainError } from '@domain/shared/DomainError';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

/**
 * Value Object que recoge el resultado de auditar un protocolo concreto:
 * el tipo evaluado, si se cumplió y la evidencia textual que lo justifica.
 * La evidencia es siempre obligatoria (toda evaluación debe ser trazable).
 * Inmutable y con igualdad estructural.
 */
export class EvaluacionProtocolo {
  private constructor(
    private readonly _tipo: TipoProtocolo,
    private readonly _cumplido: boolean,
    private readonly _evidencia: Evidencia,
  ) {}

  static crear(tipo: TipoProtocolo, cumplido: boolean, evidencia: Evidencia): EvaluacionProtocolo {
    if (!(evidencia instanceof Evidencia)) {
      throw new DomainError('Toda evaluación de protocolo debe aportar una evidencia.');
    }
    return new EvaluacionProtocolo(tipo, cumplido, evidencia);
  }

  get tipo(): TipoProtocolo {
    return this._tipo;
  }

  get cumplido(): boolean {
    return this._cumplido;
  }

  get evidencia(): Evidencia {
    return this._evidencia;
  }

  esIgualA(otra: EvaluacionProtocolo): boolean {
    return (
      this._tipo.esIgualA(otra._tipo) &&
      this._cumplido === otra._cumplido &&
      this._evidencia.esIgualA(otra._evidencia)
    );
  }
}
