import { describe, it, expect, beforeEach } from 'vitest';
import { ApiAuditoria } from '@infrastructure/web/ApiAuditoria';
import { construirContexto } from '@infrastructure/config/construirContexto';
import type { ResultadoAuditoriaDto, LlamadaDto } from '@infrastructure/web/AuditoriaPresentador';

const crearApi = () => new ApiAuditoria(construirContexto({ modo: 'demo' }));

describe('ApiAuditoria', () => {
  let api: ApiAuditoria;

  beforeEach(() => {
    api = crearApi();
  });

  it('GET /api/llamadas devuelve la lista de llamadas pendientes', async () => {
    const respuesta = await api.manejar({ metodo: 'GET', ruta: '/api/llamadas' });
    expect(respuesta.estado).toBe(200);
    const llamadas = respuesta.cuerpo as LlamadaDto[];
    expect(Array.isArray(llamadas)).toBe(true);
    expect(llamadas.length).toBeGreaterThanOrEqual(1);
    expect(llamadas[0]?.id).toBeDefined();
  });

  it('POST /api/llamadas/:id/auditorias audita la llamada y devuelve 201 con el resultado', async () => {
    const respuesta = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    expect(respuesta.estado).toBe(201);
    const dto = respuesta.cuerpo as ResultadoAuditoriaDto;
    expect(dto.llamadaId).toBe('llamada-001');
    expect(dto.puntuacion).toBeGreaterThanOrEqual(0);
    expect(dto.puntuacion).toBeLessThanOrEqual(100);
  });

  it('POST sobre una llamada inexistente devuelve 404', async () => {
    const respuesta = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/no-existe/auditorias' });
    expect(respuesta.estado).toBe(404);
    expect((respuesta.cuerpo as { error: string }).error).toMatch(/no-existe/);
  });

  it('GET /api/llamadas/:id/auditorias lista las auditorías realizadas de esa llamada', async () => {
    await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const respuesta = await api.manejar({ metodo: 'GET', ruta: '/api/llamadas/llamada-001/auditorias' });
    expect(respuesta.estado).toBe(200);
    const auditorias = respuesta.cuerpo as ResultadoAuditoriaDto[];
    expect(auditorias.length).toBeGreaterThanOrEqual(1);
    expect(auditorias[0]?.llamadaId).toBe('llamada-001');
  });

  it('POST /api/llamadas registra una nueva llamada y devuelve 201 con el DTO', async () => {
    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/llamadas',
      cuerpo: {
        agenteId: 'agente-099',
        intervenciones: [
          { rol: 'AGENTE', texto: 'Buenos días, le atiende soporte' },
          { rol: 'CLIENTE', texto: 'Tengo una consulta' },
        ],
      },
    });
    expect(respuesta.estado).toBe(201);
    const dto = respuesta.cuerpo as LlamadaDto;
    expect(dto.id).toBeDefined();
    expect(dto.agenteId).toBe('agente-099');
    expect(dto.numeroIntervenciones).toBe(2);
  });

  it('la llamada registrada vía POST aparece luego en GET /api/llamadas', async () => {
    const alta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/llamadas',
      cuerpo: { agenteId: 'agente-099', intervenciones: [{ rol: 'AGENTE', texto: 'Hola' }] },
    });
    const id = (alta.cuerpo as LlamadaDto).id;
    const lista = await api.manejar({ metodo: 'GET', ruta: '/api/llamadas' });
    const llamadas = lista.cuerpo as LlamadaDto[];
    expect(llamadas.some((l) => l.id === id)).toBe(true);
  });

  it('POST /api/llamadas con un cuerpo inválido devuelve 400', async () => {
    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/llamadas',
      cuerpo: { intervenciones: [] },
    });
    expect(respuesta.estado).toBe(400);
  });

  it('POST /api/llamadas con un rol fuera del catálogo del dominio devuelve 400', async () => {
    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/llamadas',
      cuerpo: { agenteId: 'agente-099', intervenciones: [{ rol: 'SUPERVISOR', texto: 'Hola' }] },
    });
    expect(respuesta.estado).toBe(400);
  });

  it('devuelve 404 para una ruta desconocida', async () => {
    const respuesta = await api.manejar({ metodo: 'GET', ruta: '/api/desconocido' });
    expect(respuesta.estado).toBe(404);
  });

  it('devuelve 405 para un método no soportado en una ruta conocida', async () => {
    const respuesta = await api.manejar({ metodo: 'DELETE', ruta: '/api/llamadas' });
    expect(respuesta.estado).toBe(405);
  });
});
