/**
 * Clase base para Value Objects cuyo estado es un único valor primitivo
 * (cadena, número, booleano). Encapsula la inmutabilidad, el acceso al valor
 * y la igualdad estructural por comparación directa.
 *
 * Para Value Objects compuestos por varios atributos se introducirá, cuando
 * aparezca el primer caso, una variante con comparación estructural.
 */
export abstract class ValueObject<T extends string | number | boolean> {
  protected constructor(protected readonly _valor: T) {}

  get valor(): T {
    return this._valor;
  }

  esIgualA(otro: this): boolean {
    return this._valor === otro._valor;
  }
}
