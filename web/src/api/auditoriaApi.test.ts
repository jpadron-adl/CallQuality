import { describe, it, expect, vi } from 'vitest';
import { crearClienteAuditoria } from '@/api/auditoriaApi';
import { ApiError } from '@/api/ApiError';
import type {
  ComparacionAuditoriasDto,
  InformeAgenteDto,
  LlamadaDto,
  NuevaLlamada,
  NuevaRevision,
  ResultadoAuditoriaDto,
} from '@/api/tipos';

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
  revision: null,
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

  it('registra una nueva llamada con POST /api/llamadas y el cuerpo en JSON', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson(LLAMADA, 201));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });
    const nueva: NuevaLlamada = {
      agenteId: 'agente-7',
      transcripcion: [{ rol: 'AGENTE', texto: 'Buenos días' }],
    };

    const creada = await api.registrarLlamada(nueva);

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/llamadas',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(nueva),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(creada).toEqual(LLAMADA);
  });

  it('revisa una auditoría con POST /api/auditorias/:id/revision y el cuerpo en JSON', async () => {
    const revisado: ResultadoAuditoriaDto = {
      ...RESULTADO,
      revision: { revisor: 'supervisor-1', fechaRevision: '2026-06-26T10:00:00.000Z', comentario: null, correcciones: [] },
    };
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson(revisado, 201));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });
    const nueva: NuevaRevision = {
      revisor: 'supervisor-1',
      correcciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: false, evidencia: 'No saluda.' }],
    };

    const resultado = await api.revisarAuditoria('auditoria-1', nueva);

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/auditorias/auditoria-1/revision',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(nueva),
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
    expect(resultado.revision?.revisor).toBe('supervisor-1');
  });

  it('obtiene el informe de un agente con GET /api/agentes/:id/informe', async () => {
    const informe: InformeAgenteDto = {
      agenteId: 'agente-7',
      numeroLlamadasAuditadas: 2,
      puntuacionMedia: 75,
      protocolosMasIncumplidos: [{ protocolo: 'DESPEDIDA', incumplimientos: 1, evaluaciones: 2 }],
      totalAlertas: 0,
      alertasPorSeveridad: [],
    };
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson(informe));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    const resultado = await api.obtenerInformeAgente('agente-7');

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/agentes/agente-7/informe',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(resultado.puntuacionMedia).toBe(75);
  });

  it('compara dos auditorías con GET /api/auditorias/:idA/comparacion/:idB y codifica los ids', async () => {
    const comparacion: ComparacionAuditoriasDto = {
      llamadaId: 'llamada-1',
      auditoriaIdA: 'a 1',
      auditoriaIdB: 'a/2',
      puntuacionA: 50,
      puntuacionB: 100,
      diferenciaPuntuacion: 50,
      protocolosCambiados: [{ protocolo: 'DESPEDIDA', cumplidoA: false, cumplidoB: true }],
      alertasAparecidas: [],
      alertasDesaparecidas: [{ tipo: 'QUEJA_GRAVE', severidad: 'MEDIA' }],
    };
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson(comparacion));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    const resultado = await api.compararAuditorias('a 1', 'a/2');

    expect(fetchFalso).toHaveBeenCalledWith(
      '/api/auditorias/a%201/comparacion/a%2F2',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(resultado.diferenciaPuntuacion).toBe(50);
  });

  it('propaga un ApiError 400 cuando el alta es rechazada por la API', async () => {
    const fetchFalso = vi.fn().mockResolvedValue(respuestaJson({ error: 'Cuerpo no válido.' }, 400));
    const api = crearClienteAuditoria({ fetch: fetchFalso, baseUrl: '' });

    await expect(
      api.registrarLlamada({ agenteId: '', transcripcion: [] }),
    ).rejects.toMatchObject({ name: 'ApiError', estado: 400 });
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
