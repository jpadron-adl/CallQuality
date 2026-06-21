import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que representa la severidad de una alerta de cumplimiento.
 * Catálogo cerrado y ORDENADO de menor a mayor gravedad: BAJA < MEDIA < ALTA < CRITICA.
 * El orden se deriva de la posición en el catálogo. Inmutable y con igualdad por valor.
 */
export class SeveridadAlerta extends ValueObject<string> {
  static readonly BAJA = new SeveridadAlerta('BAJA');
  static readonly MEDIA = new SeveridadAlerta('MEDIA');
  static readonly ALTA = new SeveridadAlerta('ALTA');
  static readonly CRITICA = new SeveridadAlerta('CRITICA');

  /** Ordenado de menor a mayor gravedad: el índice define el nivel. */
  private static readonly CATALOGO: readonly SeveridadAlerta[] = [
    SeveridadAlerta.BAJA,
    SeveridadAlerta.MEDIA,
    SeveridadAlerta.ALTA,
    SeveridadAlerta.CRITICA,
  ];

  static desde(valor: string): SeveridadAlerta {
    const normalizado = valor.trim().toUpperCase();
    const encontrado = this.CATALOGO.find((severidad) => severidad.valor === normalizado);
    if (encontrado === undefined) {
      const validos = this.CATALOGO.map((severidad) => severidad.valor).join(', ');
      throw new DomainError(
        `Severidad de alerta no válida: "${valor}". Valores admitidos: ${validos}.`,
      );
    }
    return encontrado;
  }

  esMasGraveQue(otra: SeveridadAlerta): boolean {
    return this.nivel() > otra.nivel();
  }

  private nivel(): number {
    return SeveridadAlerta.CATALOGO.indexOf(this);
  }
}
