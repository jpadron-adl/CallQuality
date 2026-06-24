import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';
import { ApiError } from '@/api/ApiError';
import type { ClienteAuditoria } from '@/api/auditoriaApi';
import type { LlamadaDto, ResultadoAuditoriaDto } from '@/api/tipos';

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
};

function clienteFalso(sobrescribir: Partial<ClienteAuditoria> = {}): ClienteAuditoria {
  return {
    listarLlamadas: vi.fn().mockResolvedValue(LLAMADAS),
    auditarLlamada: vi.fn().mockResolvedValue(RESULTADO),
    listarAuditorias: vi.fn().mockResolvedValue([]),
    registrarLlamada: vi.fn().mockResolvedValue(LLAMADAS[0]),
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

    await userEvent.click(await screen.findByRole('button', { name: /auditar/i }));

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

  it('registra una nueva llamada desde el formulario y recarga el listado', async () => {
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

    await userEvent.type(screen.getByLabelText(/identificador del agente/i), 'agente-99');
    await userEvent.type(screen.getByLabelText(/texto de la intervención 1/i), 'Hola');
    await userEvent.click(screen.getByRole('button', { name: /registrar llamada/i }));

    expect(cliente.registrarLlamada).toHaveBeenCalledWith({
      agenteId: 'agente-99',
      intervenciones: [{ rol: 'AGENTE', texto: 'Hola' }],
    });
    expect(await screen.findByText('agente-99')).toBeInTheDocument();
    expect(listarLlamadas).toHaveBeenCalledTimes(2);
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
