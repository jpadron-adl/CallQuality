import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { ApiError } from '@/api/ApiError';
import type { ClienteAuditoria } from '@/api/auditoriaApi';
import type {
  ComparacionAuditoriasDto,
  LlamadaDto,
  ResultadoAuditoriaDto,
  ResumenLoteDto,
} from '@/api/tipos';

const LLAMADAS: LlamadaDto[] = [
  { id: 'llamada-1', agenteId: 'agente-7', fechaInicio: '2026-06-20T09:05:00.000Z', numeroIntervenciones: 4 },
];

const RESULTADO: ResultadoAuditoriaDto = {
  id: 'auditoria-1',
  llamadaId: 'llamada-1',
  fechaAuditoria: '2026-06-20T09:05:00.000Z',
  puntuacion: 75,
  tieneAlertas: false,
  evaluaciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días...' }],
  alertas: [],
  revision: null,
};

function clienteFalso(sobrescribir: Partial<ClienteAuditoria> = {}): ClienteAuditoria {
  return {
    listarLlamadas: vi.fn().mockResolvedValue(LLAMADAS),
    auditarLlamada: vi.fn().mockResolvedValue(RESULTADO),
    listarAuditorias: vi.fn().mockResolvedValue([]),
    registrarLlamada: vi.fn().mockResolvedValue(LLAMADAS[0]),
    revisarAuditoria: vi.fn().mockResolvedValue(RESULTADO),
    obtenerInformeAgente: vi.fn().mockResolvedValue({
      agenteId: 'agente-7',
      numeroLlamadasAuditadas: 0,
      puntuacionMedia: 0,
      protocolosMasIncumplidos: [],
      totalAlertas: 0,
      alertasPorSeveridad: [],
    }),
    compararAuditorias: vi.fn().mockResolvedValue({
      llamadaId: 'llamada-1',
      auditoriaIdA: 'auditoria-1',
      auditoriaIdB: 'auditoria-2',
      puntuacionA: 75,
      puntuacionB: 100,
      diferenciaPuntuacion: 25,
      protocolosCambiados: [],
      alertasAparecidas: [],
      alertasDesaparecidas: [],
    } satisfies ComparacionAuditoriasDto),
    auditarLote: vi.fn().mockResolvedValue({
      totalPendientes: 0,
      auditadas: 0,
      fallidas: 0,
      resultados: [],
      fallos: [],
    } satisfies ResumenLoteDto),
    ...sobrescribir,
  };
}

describe('App', () => {
  it('carga y muestra las llamadas pendientes al montar', async () => {
    render(<App cliente={clienteFalso()} />);
    expect(await screen.findByText('agente-7')).toBeInTheDocument();
  });

  it('audita una llamada al pulsar su botón y muestra el resultado', async () => {
    const cliente = clienteFalso();
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Auditar' }));

    expect(cliente.auditarLlamada).toHaveBeenCalledWith('llamada-1');
    expect(await screen.findByText('Puntuación de calidad')).toBeInTheDocument();
    expect(screen.getByText('75 / 100')).toBeInTheDocument();
  });

  it('muestra un mensaje de error si la carga de llamadas falla', async () => {
    const cliente = clienteFalso({
      listarLlamadas: vi.fn().mockRejectedValue(new ApiError(500, 'Error interno del servidor.')),
    });
    render(<App cliente={cliente} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/error interno del servidor/i);
  });

  it('carga y muestra el historial de auditorías de una llamada al pulsar su botón', async () => {
    const cliente = clienteFalso({
      listarAuditorias: vi.fn().mockResolvedValue([RESULTADO]),
    });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /historial/i }));

    expect(cliente.listarAuditorias).toHaveBeenCalledWith('llamada-1');
    expect(await screen.findByText('Auditoría 1')).toBeInTheDocument();
  });

  it('indica que no hay auditorías cuando el historial está vacío', async () => {
    const cliente = clienteFalso({ listarAuditorias: vi.fn().mockResolvedValue([]) });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /historial/i }));

    expect(await screen.findByText(/no tiene auditor[ií]as registradas/i)).toBeInTheDocument();
  });

  it('registra una nueva llamada subiendo un fichero JSON y recarga el listado', async () => {
    const nueva: LlamadaDto = {
      id: 'llamada-2',
      agenteId: 'agente-99',
      fechaInicio: '2026-06-24T09:00:00.000Z',
      numeroIntervenciones: 1,
    };
    const listarLlamadas = vi
      .fn()
      .mockResolvedValueOnce(LLAMADAS)
      .mockResolvedValueOnce([...LLAMADAS, nueva]);
    const cliente = clienteFalso({ listarLlamadas, registrarLlamada: vi.fn().mockResolvedValue(nueva) });
    render(<App cliente={cliente} />);

    await screen.findByText('agente-7');

    const fichero = new File(
      [JSON.stringify({ agenteId: 'agente-99', transcripcion: [{ rol: 'AGENTE', texto: 'Hola' }] })],
      'llamada.json',
      { type: 'application/json' },
    );
    await userEvent.upload(screen.getByLabelText(/fichero de la llamada/i), fichero);
    await userEvent.click(await screen.findByRole('button', { name: /registrar llamada/i }));

    expect(cliente.registrarLlamada).toHaveBeenCalledWith({
      agenteId: 'agente-99',
      transcripcion: [{ rol: 'AGENTE', texto: 'Hola' }],
    });
    const pendientes = screen.getByRole('region', { name: /llamadas pendientes/i });
    expect(await within(pendientes).findByText('agente-99')).toBeInTheDocument();
    expect(listarLlamadas).toHaveBeenCalledTimes(2);
  });

  it('revisa una auditoría desde el historial y recarga el listado de auditorías', async () => {
    const revisado: ResultadoAuditoriaDto = {
      ...RESULTADO,
      revision: { revisor: 'supervisor-01', fechaRevision: '2026-06-26T10:00:00.000Z', comentario: null, correcciones: [] },
    };
    const listarAuditorias = vi.fn().mockResolvedValue([RESULTADO]);
    const cliente = clienteFalso({
      listarAuditorias,
      revisarAuditoria: vi.fn().mockResolvedValue(revisado),
    });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /historial/i }));
    await userEvent.click(await screen.findByRole('button', { name: /ver detalle/i }));
    await userEvent.type(screen.getByLabelText(/revisor/i), 'supervisor-01');
    await userEvent.click(screen.getByRole('button', { name: /guardar revisión/i }));

    expect(cliente.revisarAuditoria).toHaveBeenCalledWith(
      'auditoria-1',
      expect.objectContaining({ revisor: 'supervisor-01' }),
    );
    // Una carga al abrir el historial y otra tras revisar para reflejar la revisión.
    expect(listarAuditorias).toHaveBeenCalledTimes(2);
  });

  it('muestra el informe de desempeño del agente al pulsar su botón de informe', async () => {
    const cliente = clienteFalso({
      obtenerInformeAgente: vi.fn().mockResolvedValue({
        agenteId: 'agente-7',
        numeroLlamadasAuditadas: 2,
        puntuacionMedia: 80,
        protocolosMasIncumplidos: [],
        totalAlertas: 0,
        alertasPorSeveridad: [],
      }),
    });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /informe/i }));

    expect(cliente.obtenerInformeAgente).toHaveBeenCalledWith('agente-7');
    expect(await screen.findByText(/2 llamadas auditadas/i)).toBeInTheDocument();
    expect(screen.getByText('80 / 100')).toBeInTheDocument();
  });

  it('compara dos auditorías seleccionadas del historial y muestra el delta', async () => {
    const segunda: ResultadoAuditoriaDto = { ...RESULTADO, id: 'auditoria-2', puntuacion: 100 };
    const cliente = clienteFalso({
      listarAuditorias: vi.fn().mockResolvedValue([RESULTADO, segunda]),
    });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /historial/i }));
    const casillas = await screen.findAllByRole('checkbox');
    await userEvent.click(casillas[0]!);
    await userEvent.click(casillas[1]!);
    await userEvent.click(screen.getByRole('button', { name: /comparar/i }));

    expect(cliente.compararAuditorias).toHaveBeenCalledWith('auditoria-1', 'auditoria-2');
    expect(await screen.findByText('+25')).toBeInTheDocument();
  });

  it('audita el lote de pendientes al pulsar su botón y muestra el resumen', async () => {
    const cliente = clienteFalso({
      auditarLote: vi.fn().mockResolvedValue({
        totalPendientes: 1,
        auditadas: 1,
        fallidas: 0,
        resultados: [RESULTADO],
        fallos: [],
      } satisfies ResumenLoteDto),
    });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /auditar pendientes/i }));

    expect(cliente.auditarLote).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/1 auditadas/i)).toBeInTheDocument();
  });

  it('re-audita la llamada desde el historial y recarga el listado de auditorías', async () => {
    const cliente = clienteFalso({ listarAuditorias: vi.fn().mockResolvedValue([RESULTADO]) });
    render(<App cliente={cliente} />);

    await userEvent.click(await screen.findByRole('button', { name: /historial/i }));
    await userEvent.click(await screen.findByRole('button', { name: /re-auditar/i }));

    expect(cliente.auditarLlamada).toHaveBeenCalledWith('llamada-1');
    // Una carga al abrir el historial y otra tras re-auditar para reflejar la nueva pasada.
    expect(cliente.listarAuditorias).toHaveBeenCalledTimes(2);
  });
});
