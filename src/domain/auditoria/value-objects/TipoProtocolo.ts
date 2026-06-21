import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que identifica un protocolo de calidad auditable.
 * Catálogo cerrado de instancias (patrón enum de clases).
 * Inmutable y con igualdad por valor.
 */
export class TipoProtocolo extends ValueObject<string> {
  static readonly SALUDO_INICIAL = new TipoProtocolo('SALUDO_INICIAL');
  static readonly VALIDACION_IDENTIDAD = new TipoProtocolo('VALIDACION_IDENTIDAD');
  static readonly OFERTA_OBLIGATORIA = new TipoProtocolo('OFERTA_OBLIGATORIA');
  static readonly LENGUAJE_ADECUADO = new TipoProtocolo('LENGUAJE_ADECUADO');
  static readonly DESPEDIDA = new TipoProtocolo('DESPEDIDA');

  private static readonly CATALOGO: readonly TipoProtocolo[] = [
    TipoProtocolo.SALUDO_INICIAL,
    TipoProtocolo.VALIDACION_IDENTIDAD,
    TipoProtocolo.OFERTA_OBLIGATORIA,
    TipoProtocolo.LENGUAJE_ADECUADO,
    TipoProtocolo.DESPEDIDA,
  ];

  static desde(valor: string): TipoProtocolo {
    const normalizado = valor.trim().toUpperCase();
    const encontrado = this.CATALOGO.find((tipo) => tipo.valor === normalizado);
    if (encontrado === undefined) {
      const validos = this.CATALOGO.map((tipo) => tipo.valor).join(', ');
      throw new DomainError(
        `Tipo de protocolo no válido: "${valor}". Valores admitidos: ${validos}.`,
      );
    }
    return encontrado;
  }

  static todos(): TipoProtocolo[] {
    return [...this.CATALOGO];
  }
}
