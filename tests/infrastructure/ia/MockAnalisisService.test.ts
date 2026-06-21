import { describe, it, expect } from 'vitest';
import { MockAnalisisService } from '@infrastructure/ia/MockAnalisisService';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';

const a = (texto: string) => Intervencion.crear(IntervinienteRol.AGENTE, texto);
const c = (texto: string) => Intervencion.crear(IntervinienteRol.CLIENTE, texto);
const transcripcion = (...turnos: Intervencion[]) => Transcripcion.crear(turnos);

const servicio = new MockAnalisisService();

describe('MockAnalisisService', () => {
  it('marca el saludo como cumplido cuando el agente saluda', async () => {
    const t = transcripcion(a('Buenos días, le atiende Ana'), c('Hola'));
    const { evaluaciones } = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    expect(evaluaciones).toHaveLength(1);
    expect(evaluaciones[0]?.cumplido).toBe(true);
  });

  it('marca el saludo como incumplido cuando el agente no saluda', async () => {
    const t = transcripcion(a('¿Su número de cliente?'), c('12345'));
    const { evaluaciones } = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    expect(evaluaciones[0]?.cumplido).toBe(false);
  });

  it('devuelve una evaluación por cada protocolo solicitado, todas con evidencia', async () => {
    const t = transcripcion(a('Buenos días'), c('Hola'));
    const protocolos = [TipoProtocolo.SALUDO_INICIAL, TipoProtocolo.DESPEDIDA, TipoProtocolo.OFERTA_OBLIGATORIA];
    const { evaluaciones } = await servicio.analizarCumplimiento(t, protocolos);
    expect(evaluaciones).toHaveLength(3);
    expect(evaluaciones.every((e) => e.evidencia.valor.length > 0)).toBe(true);
  });

  it('considera el lenguaje adecuado cuando no hay términos ofensivos del agente', async () => {
    const t = transcripcion(a('Con mucho gusto le ayudo'), c('Gracias'));
    const { evaluaciones } = await servicio.analizarCumplimiento(t, [TipoProtocolo.LENGUAJE_ADECUADO]);
    expect(evaluaciones[0]?.cumplido).toBe(true);
  });

  it('detecta una alerta de amenaza a partir de las palabras del cliente', async () => {
    const t = transcripcion(a('Buenos días'), c('Le voy a denunciar y hablaré con mi abogado'));
    const { alertas } = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    expect(alertas.some((alerta) => alerta.tipo.esIgualA(TipoAlerta.AMENAZA))).toBe(true);
  });

  it('no genera alertas en una conversación limpia', async () => {
    const t = transcripcion(a('Buenos días'), c('Muchas gracias, todo correcto'));
    const { alertas } = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    expect(alertas).toHaveLength(0);
  });

  it('es determinista: las mismas entradas producen el mismo resultado', async () => {
    const t = transcripcion(a('Buenos días'), c('Le voy a denunciar'));
    const r1 = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    const r2 = await servicio.analizarCumplimiento(t, [TipoProtocolo.SALUDO_INICIAL]);
    expect(r1.evaluaciones[0]?.cumplido).toBe(r2.evaluaciones[0]?.cumplido);
    expect(r1.alertas).toHaveLength(r2.alertas.length);
  });
});
