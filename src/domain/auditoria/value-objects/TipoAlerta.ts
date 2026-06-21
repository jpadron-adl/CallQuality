import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que clasifica una alerta de cumplimiento detectada en la llamada.
 * Catálogo cerrado de instancias. Inmutable y con igualdad por valor.
 */
export class TipoAlerta extends ValueObject<string> {
  static readonly FRAUDE = new TipoAlerta('FRAUDE');
  static readonly QUEJA_GRAVE = new TipoAlerta('QUEJA_GRAVE');
  static readonly AMENAZA = new TipoAlerta('AMENAZA');
  static readonly LENGUAJE_OFENSIVO = new TipoAlerta('LENGUAJE_OFENSIVO');

  private static readonly CATALOGO: readonly TipoAlerta[] = [
    TipoAlerta.FRAUDE,
    TipoAlerta.QUEJA_GRAVE,
    TipoAlerta.AMENAZA,
    TipoAlerta.LENGUAJE_OFENSIVO,
  ];

  static desde(valor: string): TipoAlerta {
    const normalizado = valor.trim().toUpperCase();
    const encontrado = this.CATALOGO.find((tipo) => tipo.valor === normalizado);
    if (encontrado === undefined) {
      const validos = this.CATALOGO.map((tipo) => tipo.valor).join(', ');
      throw new DomainError(
        `Tipo de alerta no válido: "${valor}". Valores admitidos: ${validos}.`,
      );
    }
    return encontrado;
  }
}
