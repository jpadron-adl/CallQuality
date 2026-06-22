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
    const respuesta = await this.api.manejar({ metodo: req.method ?? 'GET', ruta });
    this.responder(res, respuesta.estado, respuesta.cuerpo);
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
