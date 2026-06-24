import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { ApiAuditoria } from '@infrastructure/web/ApiAuditoria';

/**
 * Adaptador de borde que expone la ApiAuditoria sobre el módulo `node:http` nativo.
 * Es el ÚNICO punto que conoce el servidor concreto: traduce los objetos req/res en
 * el contrato PeticionHttp/RespuestaHttp y serializa el cuerpo a JSON. Toda la lógica
 * de enrutado y de negocio vive en la API, ajena al transporte. Habilita CORS para
 * que el dashboard (otro origen en desarrollo) pueda consumir la API.
 */
export class ServidorHttp {
  private servidor: Server | undefined;

  constructor(private readonly api: ApiAuditoria) {}

  /** Inicia el servidor y resuelve con el puerto real (útil con el puerto efímero 0). */
  iniciar(puerto: number): Promise<number> {
    const servidor = createServer((req, res) => {
      this.atender(req, res).catch(() => this.responder(res, 500, { error: 'Error interno del servidor.' }));
    });
    this.servidor = servidor;

    return new Promise((resolve) => {
      servidor.listen(puerto, () => {
        resolve((servidor.address() as AddressInfo).port);
      });
    });
  }

  detener(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.servidor === undefined) {
        resolve();
        return;
      }
      this.servidor.close((error) => (error ? reject(error) : resolve()));
    });
  }

  private async atender(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'OPTIONS') {
      this.responder(res, 204, null);
      return;
    }

    const ruta = new URL(req.url ?? '/', 'http://localhost').pathname;
    const metodo = req.method ?? 'GET';

    let cuerpo: unknown;
    try {
      cuerpo = await this.leerCuerpo(req);
    } catch {
      this.responder(res, 400, { error: 'El cuerpo de la petición no es JSON válido.' });
      return;
    }

    const respuesta = await this.api.manejar({ metodo, ruta, cuerpo });
    this.responder(res, respuesta.estado, respuesta.cuerpo);
  }

  /**
   * Acumula el cuerpo de la petición y lo deserializa como JSON. Devuelve undefined
   * cuando no hay cuerpo (p. ej. GET); lanza si el contenido recibido no es JSON válido.
   */
  private leerCuerpo(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const fragmentos: Buffer[] = [];
      req.on('data', (fragmento: Buffer) => fragmentos.push(fragmento));
      req.on('error', reject);
      req.on('end', () => {
        const crudo = Buffer.concat(fragmentos).toString('utf-8').trim();
        if (crudo.length === 0) {
          resolve(undefined);
          return;
        }
        try {
          resolve(JSON.parse(crudo));
        } catch (error) {
          reject(error instanceof Error ? error : new Error('JSON no válido'));
        }
      });
    });
  }

  private responder(res: ServerResponse, estado: number, cuerpo: unknown): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (estado === 204 || cuerpo === null) {
      res.writeHead(estado);
      res.end();
      return;
    }
    res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(cuerpo));
  }
}
