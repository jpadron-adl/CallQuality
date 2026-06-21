import { DomainError } from '@domain/shared/DomainError';
import { ValueObject } from '@domain/shared/ValueObject';

/**
 * Value Object que representa el rol de quien interviene en un turno de la llamada.
 * Catálogo cerrado de instancias (patrón enum de clases): AGENTE, CLIENTE, SISTEMA.
 * Inmutable y con igualdad por valor.
 */
export class IntervinienteRol extends ValueObject<string> {
  static readonly AGENTE = new IntervinienteRol('AGENTE');
  static readonly CLIENTE = new IntervinienteRol('CLIENTE');
  static readonly SISTEMA = new IntervinienteRol('SISTEMA');

  private static readonly CATALOGO: readonly IntervinienteRol[] = [
    IntervinienteRol.AGENTE,
    IntervinienteRol.CLIENTE,
    IntervinienteRol.SISTEMA,
  ];

  static desde(valor: string): IntervinienteRol {
    const normalizado = valor.trim().toUpperCase();
    const encontrado = this.CATALOGO.find((rol) => rol.valor === normalizado);
    if (encontrado === undefined) {
      const validos = this.CATALOGO.map((rol) => rol.valor).join(', ');
      throw new DomainError(
        `Rol de interviniente no válido: "${valor}". Valores admitidos: ${validos}.`,
      );
    }
    return encontrado;
  }

  esAgente(): boolean {
    return this === IntervinienteRol.AGENTE;
  }

  esCliente(): boolean {
    return this === IntervinienteRol.CLIENTE;
  }

  esSistema(): boolean {
    return this === IntervinienteRol.SISTEMA;
  }
}
