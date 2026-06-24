/**
 * Contrato HTTP mínimo y agnóstico del servidor. Permite enrutar y testear la API
 * sin acoplarse a `node:http` ni a ningún framework: el adaptador de borde traduce
 * entre los objetos nativos del servidor y estas estructuras.
 */
export interface PeticionHttp {
  readonly metodo: string;
  /** Ruta (pathname) sin querystring, p. ej. "/api/llamadas". */
  readonly ruta: string;
  /** Cuerpo ya deserializado de la petición (JSON), si lo hubiera. */
  readonly cuerpo?: unknown;
}

export interface RespuestaHttp {
  readonly estado: number;
  readonly cuerpo: unknown;
}
