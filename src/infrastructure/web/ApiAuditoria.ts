import type { ContextoAplicacion } from '@infrastructure/config/construirContexto';
import type { PeticionHttp, RespuestaHttp } from '@infrastructure/web/HttpContrato';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';
import { DomainError } from '@domain/shared/DomainError';
import { LlamadaNoEncontradaError } from '@application/shared/LlamadaNoEncontradaError';
import { presentarLlamada, presentarResultadoAuditoria } from '@infrastructure/web/AuditoriaPresentador';
import {
  registrarLlamadaSchema,
  aComandoRegistrarLlamada,
} from '@infrastructure/web/RegistrarLlamadaSchema';
import {
  revisarAuditoriaSchema,
  aComandoRevisarAuditoria,
} from '@infrastructure/web/RevisarAuditoriaSchema';
import { AuditoriaNoEncontradaError } from '@application/shared/AuditoriaNoEncontradaError';

const RUTA_AUDITORIAS = /^\/api\/llamadas\/([^/]+)\/auditorias$/;
const RUTA_REVISION = /^\/api\/auditorias\/([^/]+)\/revision$/;

/**
 * Adaptador de entrada HTTP (controlador) de la API de auditoría. Traduce peticiones
 * abstractas (PeticionHttp) en invocaciones de los casos de uso y serializa la salida
 * con los presentadores. No conoce `node:http`: es testeable en memoria. Mapea los
 * errores de aplicación a códigos HTTP, sin filtrar excepciones internas al cliente.
 */
export class ApiAuditoria {
  constructor(private readonly contexto: ContextoAplicacion) {}

  async manejar(peticion: PeticionHttp): Promise<RespuestaHttp> {
    const ruta = this.normalizar(peticion.ruta);

    if (ruta === '/api/llamadas') {
      if (peticion.metodo === 'GET') return this.listarLlamadas();
      if (peticion.metodo === 'POST') return this.registrarLlamada(peticion.cuerpo);
      return this.metodoNoPermitido();
    }

    const coincidencia = RUTA_AUDITORIAS.exec(ruta);
    if (coincidencia !== null) {
      const id = decodeURIComponent(coincidencia[1]!);
      if (peticion.metodo === 'POST') return this.auditarLlamada(id);
      if (peticion.metodo === 'GET') return this.listarAuditorias(id);
      return this.metodoNoPermitido();
    }

    const revision = RUTA_REVISION.exec(ruta);
    if (revision !== null) {
      const id = decodeURIComponent(revision[1]!);
      if (peticion.metodo === 'POST') return this.revisarAuditoria(id, peticion.cuerpo);
      return this.metodoNoPermitido();
    }

    return { estado: 404, cuerpo: { error: `Ruta no encontrada: ${ruta}` } };
  }

  private async listarLlamadas(): Promise<RespuestaHttp> {
    const llamadas = await this.contexto.llamadas.listarPendientesDeAuditar();
    return { estado: 200, cuerpo: llamadas.map(presentarLlamada) };
  }

  private async registrarLlamada(cuerpo: unknown): Promise<RespuestaHttp> {
    const validacion = registrarLlamadaSchema.safeParse(cuerpo);
    if (!validacion.success) {
      return { estado: 400, cuerpo: { error: 'Cuerpo de la petición no válido.' } };
    }
    try {
      const comando = aComandoRegistrarLlamada(validacion.data);
      const llamada = await this.contexto.registrarLlamada.ejecutar(comando);
      return { estado: 201, cuerpo: presentarLlamada(llamada) };
    } catch (error) {
      // El dominio rechaza datos que la validación sintáctica no cubre (rol fuera
      // del catálogo): es un error del cliente, no un fallo interno del servidor.
      if (error instanceof DomainError) {
        return { estado: 400, cuerpo: { error: error.message } };
      }
      throw error;
    }
  }

  private async revisarAuditoria(id: string, cuerpo: unknown): Promise<RespuestaHttp> {
    const validacion = revisarAuditoriaSchema.safeParse(cuerpo);
    if (!validacion.success) {
      return { estado: 400, cuerpo: { error: 'Cuerpo de la petición no válido.' } };
    }
    try {
      const comando = aComandoRevisarAuditoria(id, validacion.data);
      const resultado = await this.contexto.revisarAuditoria.ejecutar(comando);
      return { estado: 201, cuerpo: presentarResultadoAuditoria(resultado) };
    } catch (error) {
      if (error instanceof AuditoriaNoEncontradaError) {
        return { estado: 404, cuerpo: { error: error.message } };
      }
      // El dominio rechaza datos que la validación sintáctica no cubre (protocolo fuera
      // del catálogo, corrección sobre un protocolo no evaluado): es un error del cliente.
      if (error instanceof DomainError) {
        return { estado: 400, cuerpo: { error: error.message } };
      }
      throw error;
    }
  }

  private async auditarLlamada(id: string): Promise<RespuestaHttp> {
    try {
      const resultado = await this.contexto.auditarLlamada.ejecutar(LlamadaId.crear(id));
      return { estado: 201, cuerpo: presentarResultadoAuditoria(resultado) };
    } catch (error) {
      if (error instanceof LlamadaNoEncontradaError) {
        return { estado: 404, cuerpo: { error: error.message } };
      }
      throw error;
    }
  }

  private async listarAuditorias(id: string): Promise<RespuestaHttp> {
    const auditorias = await this.contexto.auditorias.obtenerPorLlamada(LlamadaId.crear(id));
    return { estado: 200, cuerpo: auditorias.map(presentarResultadoAuditoria) };
  }

  private metodoNoPermitido(): RespuestaHttp {
    return { estado: 405, cuerpo: { error: 'Método no permitido para esta ruta.' } };
  }

  /** Elimina la barra final redundante (salvo la raíz) para enrutar de forma estable. */
  private normalizar(ruta: string): string {
    return ruta.length > 1 && ruta.endsWith('/') ? ruta.slice(0, -1) : ruta;
  }
}
