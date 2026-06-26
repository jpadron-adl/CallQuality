import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ServidorHttp } from '@infrastructure/web/ServidorHttp';
import { ApiAuditoria } from '@infrastructure/web/ApiAuditoria';
import { construirContexto } from '@infrastructure/config/construirContexto';

describe('ServidorHttp (integración sobre loopback)', () => {
  let servidor: ServidorHttp;
  let base: string;

  beforeAll(async () => {
    servidor = new ServidorHttp(new ApiAuditoria(construirContexto({ modo: 'demo' })));
    const puerto = await servidor.iniciar(0);
    base = `http://127.0.0.1:${puerto}`;
  });

  afterAll(async () => {
    await servidor.detener();
  });

  it('responde a GET /api/llamadas con 200 y JSON', async () => {
    const respuesta = await fetch(`${base}/api/llamadas`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toContain('application/json');
    const cuerpo = await respuesta.json();
    expect(Array.isArray(cuerpo)).toBe(true);
  });

  it('audita una llamada vía POST y devuelve 201', async () => {
    const respuesta = await fetch(`${base}/api/llamadas/llamada-001/auditorias`, { method: 'POST' });
    expect(respuesta.status).toBe(201);
    const cuerpo = (await respuesta.json()) as { llamadaId: string };
    expect(cuerpo.llamadaId).toBe('llamada-001');
  });

  it('registra una llamada vía POST con cuerpo JSON y devuelve 201', async () => {
    const respuesta = await fetch(`${base}/api/llamadas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agenteId: 'agente-099',
        transcripcion: [{ rol: 'AGENTE', texto: 'Buenos días' }],
      }),
    });
    expect(respuesta.status).toBe(201);
    const cuerpo = (await respuesta.json()) as { agenteId: string; numeroIntervenciones: number };
    expect(cuerpo.agenteId).toBe('agente-099');
    expect(cuerpo.numeroIntervenciones).toBe(1);
  });

  it('devuelve 400 ante un cuerpo JSON mal formado', async () => {
    const respuesta = await fetch(`${base}/api/llamadas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ esto no es json',
    });
    expect(respuesta.status).toBe(400);
  });

  it('devuelve 404 en una ruta desconocida', async () => {
    const respuesta = await fetch(`${base}/api/nope`);
    expect(respuesta.status).toBe(404);
  });

  it('responde al preflight CORS con 204', async () => {
    const respuesta = await fetch(`${base}/api/llamadas`, { method: 'OPTIONS' });
    expect(respuesta.status).toBe(204);
    expect(respuesta.headers.get('access-control-allow-origin')).toBe('*');
  });
});
