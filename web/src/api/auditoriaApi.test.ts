import { describe, it, expect, vi } from 'vitest';
import { crearClienteAuditoria } from '@/api/auditoriaApi';
import { ApiError } from '@/api/ApiError';
import type { LlamadaDto, ResultadoAuditoriaDto } from '@/api/tipos';

/** Construye una respuesta `fetch` falsa con cuerpo JSON y estado configurables. */
function respuestaJson(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

const LLAMADA: LlamadaDto = {
  id: 'llamada-1',
  agenteId: 'agente-7',
  fechaInicio: '2026-06-20T10:00:00.000Z',
  numeroIntervenciones: 4,
};

const RESULTADO: ResultadoAuditoriaDto = {
  id: 'auditoria-1',
  llamadaId: 'llamada-1',
  fechaAuditoria: '2026-06-20T09:05:00.000Z',
  puntuacion: 75,
  tieneAlertas: true,
  evaluaciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días...' }],
  alertas: [{ tipo: 'LENGUAJE_INADECUADO', severidad: 'ALTA', evidencia: '...' }],
};

describe('crearClienteAuditoria', () => {
  it('lista las llamadas pendientes con GET /api/llamadas', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson([LLAMADA]));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    const llamadas = await api.listarLlamadas();

    expect(fetchFalso).toHaveBeenCalledWith('/api/llamadas', expect.objectContaining({ method: 'GET' }));
    expect(llamadas).toEqual([LLAMADA]);
  });

  it('audita una llamada con POST y codifica el id en la ruta', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson(RESULTADO, 201));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    const resultado = await api.auditarLlamada('llamada 1/x');

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/llamadas/llamada%201%2Fx/auditorias',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(resultado).toEqual(RESULTADO);
  });

  it('lista las auditorías previas de una llamada con GET', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson([RESULTADO]));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    const auditorias = await api.listarAuditorias('llamada-1');

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/llamadas/llamada-1/auditorias',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(auditorias).toEqual([RESULTADO]);
  });

  it('antepone la baseUrl configurada a la ruta', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson([]));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: 'http://127.0.0.1:3000' });

    await api.listarLlamadas();

    expect(fetchFalso).toHaveBeenCalledWith('http://127.0.0.1:3000/api/llamadas', expect.anything());
  });

  it('lanza ApiError con el estado y el mensaje del cuerpo cuando la respuesta no es ok', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson({ error: 'Llamada no encontrada.' }, 404));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    await expect(api.auditarLlamada('inexistente')).rejects.toMatchObject({
      name: 'ApiError',
      estado: 404,
      message: 'Llamada no encontrada.',
    });
    await expect(api.auditarLlamada('inexistente')).rejects.toBeInstanceOf(ApiError);
  });

  it('lanza ApiError genérico si el cuerpo de error no es JSON interpretable', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(
      new Response('502 Bad Gateway', { status: 502 }),
    );
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    await expect(api.listarLlamadas()).rejects.toMatchObject({ estado: 502 });
  });
});
