import { DomainError } from '@domain/shared/DomainError';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

/**
 * Value Object que representa una alerta de cumplimiento detectada en la llamada
 * (fraude, queja grave, amenaza, lenguaje ofensivo): su tipo, su severidad y la
 * evidencia textual que la justifica. La evidencia es siempre obligatoria.
 * Inmutable y con igualdad estructural.
 */
export class AlertaCumplimiento {
  private constructor(
    private readonly _tipo: TipoAlerta,
    private readonly _severidad: SeveridadAlerta,
    private readonly _evidencia: Evidencia,
  ) {}

  static crear(tipo: TipoAlerta, severidad: SeveridadAlerta, evidencia: Evidencia): AlertaCumplimiento {
    if (!(evidencia instanceof Evidencia)) {
      throw new DomainError('Toda alerta de cumplimiento debe aportar una evidencia.');
    }
    return new AlertaCumplimiento(tipo, severidad, evidencia);
  }

  get tipo(): TipoAlerta {
    return this._tipo;
  }

  get severidad(): SeveridadAlerta {
    return this._severidad;
  }

  get evidencia(): Evidencia {
    return this._evidencia;
  }

  esIgualA(otra: AlertaCumplimiento): boolean {
    return (
      this._tipo.esIgualA(otra._tipo) &&
      this._severidad.esIgualA(otra._severidad) &&
      this._evidencia.esIgualA(otra._evidencia)
    );
  }
}
