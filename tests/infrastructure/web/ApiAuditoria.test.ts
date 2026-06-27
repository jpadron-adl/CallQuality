import { describe, it, expect, beforeEach } from 'vitest';
import { ApiAuditoria } from '@infrastructure/web/ApiAuditoria';
import { construirContexto } from '@infrastructure/config/construirContexto';
import type {
  ResultadoAuditoriaDto,
  LlamadaDto,
  InformeAgenteDto,
  ComparacionAuditoriasDto,
  ResumenLoteDto,
} from '@infrastructure/web/AuditoriaPresentador';

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
        transcripcion: [
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
      cuerpo: { agenteId: 'agente-099', transcripcion: [{ rol: 'AGENTE', texto: 'Hola' }] },
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
      cuerpo: { transcripcion: [] },
    });
    expect(respuesta.estado).toBe(400);
  });

  it('POST /api/llamadas con un rol fuera del catálogo del dominio devuelve 400', async () => {
    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/llamadas',
      cuerpo: { agenteId: 'agente-099', transcripcion: [{ rol: 'SUPERVISOR', texto: 'Hola' }] },
    });
    expect(respuesta.estado).toBe(400);
  });

  it('POST /api/auditorias/:id/revision revisa la auditoría y devuelve 201 con la revisión aplicada', async () => {
    const alta = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const auditoriaId = (alta.cuerpo as ResultadoAuditoriaDto).id;

    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: `/api/auditorias/${auditoriaId}/revision`,
      cuerpo: {
        revisor: 'supervisor-01',
        comentario: 'Revisada.',
        correcciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: false, evidencia: 'No saluda realmente.' }],
      },
    });

    expect(respuesta.estado).toBe(201);
    const dto = respuesta.cuerpo as ResultadoAuditoriaDto;
    expect(dto.revision?.revisor).toBe('supervisor-01');
    expect(dto.evaluaciones.find((e) => e.protocolo === 'SALUDO_INICIAL')?.cumplido).toBe(false);
  });

  it('POST /api/auditorias/:id/revision sobre una auditoría inexistente devuelve 404', async () => {
    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: '/api/auditorias/no-existe/revision',
      cuerpo: { revisor: 'supervisor-01' },
    });
    expect(respuesta.estado).toBe(404);
  });

  it('POST /api/auditorias/:id/revision con un cuerpo inválido (sin revisor) devuelve 400', async () => {
    const alta = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const auditoriaId = (alta.cuerpo as ResultadoAuditoriaDto).id;

    const respuesta = await api.manejar({
      metodo: 'POST',
      ruta: `/api/auditorias/${auditoriaId}/revision`,
      cuerpo: { comentario: 'sin revisor' },
    });
    expect(respuesta.estado).toBe(400);
  });

  it('GET /api/agentes/:id/informe devuelve el informe de desempeño del agente', async () => {
    await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });

    const respuesta = await api.manejar({ metodo: 'GET', ruta: '/api/agentes/agente-007/informe' });

    expect(respuesta.estado).toBe(200);
    const dto = respuesta.cuerpo as InformeAgenteDto;
    expect(dto.agenteId).toBe('agente-007');
    expect(dto.numeroLlamadasAuditadas).toBe(1);
    expect(dto.puntuacionMedia).toBeGreaterThanOrEqual(0);
    expect(dto.puntuacionMedia).toBeLessThanOrEqual(100);
  });

  it('GET /api/auditorias/:idA/comparacion/:idB compara dos auditorías de la misma llamada', async () => {
    const r1 = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const r2 = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const idA = (r1.cuerpo as ResultadoAuditoriaDto).id;
    const idB = (r2.cuerpo as ResultadoAuditoriaDto).id;

    const respuesta = await api.manejar({
      metodo: 'GET',
      ruta: `/api/auditorias/${idA}/comparacion/${idB}`,
    });

    expect(respuesta.estado).toBe(200);
    const dto = respuesta.cuerpo as ComparacionAuditoriasDto;
    expect(dto.llamadaId).toBe('llamada-001');
    expect(dto.auditoriaIdA).toBe(idA);
    expect(dto.auditoriaIdB).toBe(idB);
    expect(typeof dto.diferenciaPuntuacion).toBe('number');
  });

  it('GET de comparación con una auditoría inexistente devuelve 404', async () => {
    const r1 = await api.manejar({ metodo: 'POST', ruta: '/api/llamadas/llamada-001/auditorias' });
    const idA = (r1.cuerpo as ResultadoAuditoriaDto).id;

    const respuesta = await api.manejar({
      metodo: 'GET',
      ruta: `/api/auditorias/${idA}/comparacion/no-existe`,
    });

    expect(respuesta.estado).toBe(404);
  });

  it('POST /api/auditorias/lote audita las llamadas pendientes y devuelve el resumen', async () => {
    const respuesta = await api.manejar({ metodo: 'POST', ruta: '/api/auditorias/lote' });

    expect(respuesta.estado).toBe(200);
    const dto = respuesta.cuerpo as ResumenLoteDto;
    expect(dto.totalPendientes).toBeGreaterThanOrEqual(1);
    expect(dto.auditadas).toBe(dto.totalPendientes);
    expect(dto.fallidas).toBe(0);
    expect(dto.resultados).toHaveLength(dto.auditadas);
  });

  it('un segundo lote no vuelve a auditar lo ya auditado', async () => {
    await api.manejar({ metodo: 'POST', ruta: '/api/auditorias/lote' });

    const respuesta = await api.manejar({ metodo: 'POST', ruta: '/api/auditorias/lote' });

    const dto = respuesta.cuerpo as ResumenLoteDto;
    expect(dto.totalPendientes).toBe(0);
    expect(dto.auditadas).toBe(0);
  });

  it('rechaza con 405 un método no soportado en la ruta del lote', async () => {
    const respuesta = await api.manejar({ metodo: 'GET', ruta: '/api/auditorias/lote' });
    expect(respuesta.estado).toBe(405);
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
