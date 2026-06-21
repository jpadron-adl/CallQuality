import type { AnalisisIaService, ResultadoAnalisis } from '@domain/auditoria/ports/AnalisisIaService';
import { Transcripcion } from '@domain/llamada/value-objects/Transcripcion';
import { Intervencion } from '@domain/llamada/value-objects/Intervencion';
import { IntervinienteRol } from '@domain/llamada/value-objects/IntervinienteRol';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';

/** Modo de evaluación de un protocolo según la presencia o ausencia de términos. */
type Modo = 'PRESENCIA' | 'AUSENCIA';

interface ReglaProtocolo {
  readonly tipo: TipoProtocolo;
  readonly modo: Modo;
  readonly rol: IntervinienteRol;
  readonly palabrasClave: readonly string[];
}

interface ReglaAlerta {
  readonly tipo: TipoAlerta;
  readonly severidad: SeveridadAlerta;
  readonly rol: IntervinienteRol;
  readonly palabrasClave: readonly string[];
}

const PALABRAS_OFENSIVAS = ['idiota', 'estúpido', 'imbécil', 'inútil'] as const;

/**
 * Adaptador de análisis para el Modo Demo (APP_MODE=demo).
 * Sustituye al LLM por reglas deterministas de detección por palabras clave sobre
 * la transcripción. No requiere API keys y es totalmente reproducible, lo que lo
 * hace evaluable y demostrable sin coste de proveedor.
 */
export class MockAnalisisService implements AnalisisIaService {
  private static readonly REGLAS_PROTOCOLO: readonly ReglaProtocolo[] = [
    { tipo: TipoProtocolo.SALUDO_INICIAL, modo: 'PRESENCIA', rol: IntervinienteRol.AGENTE, palabrasClave: ['buenos días', 'buenas tardes', 'buenas noches', 'hola', 'bienvenido'] },
    { tipo: TipoProtocolo.VALIDACION_IDENTIDAD, modo: 'PRESENCIA', rol: IntervinienteRol.AGENTE, palabrasClave: ['dni', 'identidad', 'fecha de nacimiento', 'número de cliente', 'confirme sus datos'] },
    { tipo: TipoProtocolo.OFERTA_OBLIGATORIA, modo: 'PRESENCIA', rol: IntervinienteRol.AGENTE, palabrasClave: ['oferta', 'promoción', 'descuento', 'le ofrezco'] },
    { tipo: TipoProtocolo.LENGUAJE_ADECUADO, modo: 'AUSENCIA', rol: IntervinienteRol.AGENTE, palabrasClave: PALABRAS_OFENSIVAS },
    { tipo: TipoProtocolo.DESPEDIDA, modo: 'PRESENCIA', rol: IntervinienteRol.AGENTE, palabrasClave: ['hasta luego', 'adiós', 'que tenga un buen día', 'gracias por su llamada'] },
  ];

  private static readonly REGLAS_ALERTA: readonly ReglaAlerta[] = [
    { tipo: TipoAlerta.FRAUDE, severidad: SeveridadAlerta.ALTA, rol: IntervinienteRol.CLIENTE, palabrasClave: ['fraude', 'estafa', 'no reconozco', 'cargo no reconocido'] },
    { tipo: TipoAlerta.QUEJA_GRAVE, severidad: SeveridadAlerta.MEDIA, rol: IntervinienteRol.CLIENTE, palabrasClave: ['queja', 'reclamación', 'reclamo', 'inadmisible'] },
    { tipo: TipoAlerta.AMENAZA, severidad: SeveridadAlerta.ALTA, rol: IntervinienteRol.CLIENTE, palabrasClave: ['denunciar', 'abogado', 'demanda'] },
    { tipo: TipoAlerta.LENGUAJE_OFENSIVO, severidad: SeveridadAlerta.ALTA, rol: IntervinienteRol.CLIENTE, palabrasClave: PALABRAS_OFENSIVAS },
  ];

  async analizarCumplimiento(
    transcripcion: Transcripcion,
    protocolos: TipoProtocolo[],
  ): Promise<ResultadoAnalisis> {
    const evaluaciones = protocolos.map((protocolo) => this.evaluar(protocolo, transcripcion));
    const alertas = this.detectarAlertas(transcripcion);
    return { evaluaciones, alertas };
  }

  private evaluar(protocolo: TipoProtocolo, transcripcion: Transcripcion): EvaluacionProtocolo {
    const regla = MockAnalisisService.REGLAS_PROTOCOLO.find((r) => r.tipo.esIgualA(protocolo));
    if (regla === undefined) {
      return EvaluacionProtocolo.crear(protocolo, false, Evidencia.crear('Protocolo sin regla de evaluación en el modo demo.'));
    }

    const coincidencia = this.buscar(transcripcion, regla.rol, regla.palabrasClave);
    if (regla.modo === 'PRESENCIA') {
      return coincidencia !== undefined
        ? EvaluacionProtocolo.crear(protocolo, true, Evidencia.crear(coincidencia.texto))
        : EvaluacionProtocolo.crear(protocolo, false, Evidencia.crear(`No se detectó "${protocolo.valor}" en las intervenciones del agente.`));
    }

    // Modo AUSENCIA: se cumple cuando NO aparecen los términos.
    return coincidencia === undefined
      ? EvaluacionProtocolo.crear(protocolo, true, Evidencia.crear('No se detectó lenguaje inadecuado del agente.'))
      : EvaluacionProtocolo.crear(protocolo, false, Evidencia.crear(coincidencia.texto));
  }

  private detectarAlertas(transcripcion: Transcripcion): AlertaCumplimiento[] {
    const alertas: AlertaCumplimiento[] = [];
    for (const regla of MockAnalisisService.REGLAS_ALERTA) {
      const coincidencia = this.buscar(transcripcion, regla.rol, regla.palabrasClave);
      if (coincidencia !== undefined) {
        alertas.push(AlertaCumplimiento.crear(regla.tipo, regla.severidad, Evidencia.crear(coincidencia.texto)));
      }
    }
    return alertas;
  }

  private buscar(
    transcripcion: Transcripcion,
    rol: IntervinienteRol,
    palabrasClave: readonly string[],
  ): Intervencion | undefined {
    return transcripcion
      .intervencionesDe(rol)
      .find((intervencion) => {
        const texto = intervencion.texto.toLowerCase();
        return palabrasClave.some((palabra) => texto.includes(palabra));
      });
  }
}
