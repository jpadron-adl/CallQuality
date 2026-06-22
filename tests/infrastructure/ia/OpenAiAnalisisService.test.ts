import { describe, it, expect } from 'vitest';
import { OpenAiAnalisisService } from '@infrastructure/ia/openai/OpenAiAnalisisService';
import { RespuestaIaInvalidaError } from '@infrastructure/ia/openai/RespuestaIaInvalidaError';
import type { ClienteChatCompletions, PeticionChat } from '@infrastructure/ia/openai/ClienteChatCompletions';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';

const a = (texto: string) => Intervencion.crear(IntervinienteRol.AGENTE, texto);
const c = (texto: string) => Intervencion.crear(IntervinienteRol.CLIENTE, texto);

const transcripcionEjemplo = Transcripcion.crear([
  a('Buenos días, le atiende Ana'),
  c('Hola, quiero denunciar un cargo'),
]);

/** Cliente en memoria que captura la petición y devuelve una respuesta fija. */
class ClienteFalso implements ClienteChatCompletions {
  ultimaPeticion: PeticionChat | undefined;

  constructor(private readonly respuesta: string) {}

  async completar(peticion: PeticionChat): Promise<string> {
    this.ultimaPeticion = peticion;
    return this.respuesta;
  }
}

const respuestaValida = JSON.stringify({
  evaluaciones: [
    { protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días, le atiende Ana' },
    { protocolo: 'DESPEDIDA', cumplido: false, evidencia: 'El agente no se despide' },
  ],
  alertas: [
    { tipo: 'FRAUDE', severidad: 'ALTA', evidencia: 'quiero denunciar un cargo' },
  ],
});

describe('OpenAiAnalisisService', () => {
  it('traduce una respuesta JSON válida del LLM a value objects del dominio', async () => {
    const servicio = new OpenAiAnalisisService(new ClienteFalso(respuestaValida));

    const { evaluaciones, alertas } = await servicio.analizarCumplimiento(transcripcionEjemplo, [
      TipoProtocolo.SALUDO_INICIAL,
      TipoProtocolo.DESPEDIDA,
    ]);

    expect(evaluaciones).toHaveLength(2);
    expect(evaluaciones[0]?.tipo.esIgualA(TipoProtocolo.SALUDO_INICIAL)).toBe(true);
    expect(evaluaciones[0]?.cumplido).toBe(true);
    expect(evaluaciones[0]?.evidencia.valor).toBe('Buenos días, le atiende Ana');
    expect(evaluaciones[1]?.cumplido).toBe(false);

    expect(alertas).toHaveLength(1);
    expect(alertas[0]?.tipo.esIgualA(TipoAlerta.FRAUDE)).toBe(true);
    expect(alertas[0]?.severidad.esIgualA(SeveridadAlerta.ALTA)).toBe(true);
  });

  it('construye el prompt incluyendo la transcripción y los protocolos solicitados', async () => {
    const cliente = new ClienteFalso(respuestaValida);
    const servicio = new OpenAiAnalisisService(cliente);

    await servicio.analizarCumplimiento(transcripcionEjemplo, [TipoProtocolo.SALUDO_INICIAL]);

    expect(cliente.ultimaPeticion).toBeDefined();
    const { system, user } = cliente.ultimaPeticion!;
    expect(system.length).toBeGreaterThan(0);
    expect(user).toContain('Buenos días, le atiende Ana');
    expect(user).toContain('AGENTE');
    expect(user).toContain('SALUDO_INICIAL');
  });

  it('lanza RespuestaIaInvalidaError cuando el contenido no es JSON', async () => {
    const servicio = new OpenAiAnalisisService(new ClienteFalso('lo siento, no puedo ayudar'));

    await expect(
      servicio.analizarCumplimiento(transcripcionEjemplo, [TipoProtocolo.SALUDO_INICIAL]),
    ).rejects.toBeInstanceOf(RespuestaIaInvalidaError);
  });

  it('lanza RespuestaIaInvalidaError cuando la estructura no respeta el esquema', async () => {
    const incompleta = JSON.stringify({ evaluaciones: [{ protocolo: 'SALUDO_INICIAL' }] });
    const servicio = new OpenAiAnalisisService(new ClienteFalso(incompleta));

    await expect(
      servicio.analizarCumplimiento(transcripcionEjemplo, [TipoProtocolo.SALUDO_INICIAL]),
    ).rejects.toBeInstanceOf(RespuestaIaInvalidaError);
  });

  it('lanza RespuestaIaInvalidaError cuando el LLM devuelve un valor fuera del catálogo del dominio', async () => {
    const fueraDeCatalogo = JSON.stringify({
      evaluaciones: [{ protocolo: 'PROTOCOLO_INEXISTENTE', cumplido: true, evidencia: 'algo' }],
      alertas: [],
    });
    const servicio = new OpenAiAnalisisService(new ClienteFalso(fueraDeCatalogo));

    await expect(
      servicio.analizarCumplimiento(transcripcionEjemplo, [TipoProtocolo.SALUDO_INICIAL]),
    ).rejects.toBeInstanceOf(RespuestaIaInvalidaError);
  });
});
