import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListaLlamadas } from '@/components/ListaLlamadas';
import type { LlamadaDto } from '@/api/tipos';

const LLAMADAS: LlamadaDto[] = [
  { id: 'llamada-1', agenteId: 'agente-7', fechaInicio: '2026-06-20T09:05:00.000Z', numeroIntervenciones: 4 },
  { id: 'llamada-2', agenteId: 'agente-3', fechaInicio: '2026-06-21T11:30:00.000Z', numeroIntervenciones: 8 },
];

describe('ListaLlamadas', () => {
  it('muestra un mensaje cuando no hay llamadas pendientes', () => {
    render(<ListaLlamadas llamadas={[]} onAuditar={vi.fn()} />);
    expect(screen.getByText(/no hay llamadas pendientes/i)).toBeInTheDocument();
  });

  it('renderiza una entrada por llamada con su agente y fecha formateada', () => {
    render(<ListaLlamadas llamadas={LLAMADAS} onAuditar={vi.fn()} />);

    expect(screen.getByText('agente-7')).toBeInTheDocument();
    expect(screen.getByText('agente-3')).toBeInTheDocument();
    expect(screen.getByText('20/06/2026, 09:05')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /auditar/i })).toHaveLength(2);
  });

  it('invoca onAuditar con el id de la llamada al pulsar su botón', async () => {
    const onAuditar = vi.fn();
    render(<ListaLlamadas llamadas={LLAMADAS} onAuditar={onAuditar} />);

    await userEvent.click(screen.getAllByRole('button', { name: /auditar/i })[0]!);

    expect(onAuditar).toHaveBeenCalledTimes(1);
    expect(onAuditar).toHaveBeenCalledWith('llamada-1');
  });

  it('deshabilita y marca como en curso el botón de la llamada que se está auditando', () => {
    render(<ListaLlamadas llamadas={LLAMADAS} onAuditar={vi.fn()} llamadaEnCurso="llamada-1" />);

    const enCurso = screen.getByRole('button', { name: /auditando/i });
    expect(enCurso).toBeDisabled();
  });

  it('no muestra el botón de historial si no se proporciona el callback', () => {
    render(<ListaLlamadas llamadas={LLAMADAS} onAuditar={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /historial/i })).not.toBeInTheDocument();
  });

  it('invoca onVerHistorial con el id de la llamada al pulsar su botón de historial', async () => {
    const onVerHistorial = vi.fn();
    render(<ListaLlamadas llamadas={LLAMADAS} onAuditar={vi.fn()} onVerHistorial={onVerHistorial} />);

    await userEvent.click(screen.getAllByRole('button', { name: /historial/i })[0]!);

    expect(onVerHistorial).toHaveBeenCalledTimes(1);
    expect(onVerHistorial).toHaveBeenCalledWith('llamada-1');
  });
});
