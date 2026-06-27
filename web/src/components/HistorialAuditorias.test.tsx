import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistorialAuditorias } from '@/components/HistorialAuditorias';
import type { ResultadoAuditoriaDto } from '@/api/tipos';

function auditoria(id: string, puntuacion: number, tieneAlertas = false): ResultadoAuditoriaDto {
  return {
    id,
    llamadaId: 'llamada-1',
    fechaAuditoria: '2026-06-20T09:05:00.000Z',
    puntuacion,
    tieneAlertas,
    evaluaciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días...' }],
    alertas: tieneAlertas ? [{ tipo: 'LENGUAJE_INADECUADO', severidad: 'ALTA', evidencia: '...' }] : [],
    revision: null,
  };
}

const AUDITORIAS: ResultadoAuditoriaDto[] = [
  auditoria('aud-1', 100, false),
  auditoria('aud-2', 60, true),
];

describe('HistorialAuditorias', () => {
  it('indica cuando la llamada no tiene auditorías registradas', () => {
    render(<HistorialAuditorias auditorias={[]} />);
    expect(screen.getByText(/no tiene auditor[ií]as registradas/i)).toBeInTheDocument();
  });

  it('lista una entrada numerada por auditoría con su puntuación', () => {
    render(<HistorialAuditorias auditorias={AUDITORIAS} />);

    expect(screen.getByText('Auditoría 1')).toBeInTheDocument();
    expect(screen.getByText('Auditoría 2')).toBeInTheDocument();
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
    expect(screen.getByText('60 / 100')).toBeInTheDocument();
    expect(screen.getAllByText('20/06/2026, 09:05')).toHaveLength(2);
  });

  it('no muestra el detalle de una auditoría hasta que se expande', () => {
    render(<HistorialAuditorias auditorias={AUDITORIAS} />);
    expect(screen.queryByText('Cumplimiento de protocolos')).not.toBeInTheDocument();
  });

  it('expande y colapsa el detalle de una auditoría al pulsar su botón', async () => {
    render(<HistorialAuditorias auditorias={[AUDITORIAS[0]!]} />);

    const verDetalle = screen.getByRole('button', { name: /ver detalle/i });
    await userEvent.click(verDetalle);
    expect(screen.getByText('Cumplimiento de protocolos')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /ocultar detalle/i }));
    expect(screen.queryByText('Cumplimiento de protocolos')).not.toBeInTheDocument();
  });

  it('no muestra el botón de re-auditar si no se proporciona el callback', () => {
    render(<HistorialAuditorias auditorias={AUDITORIAS} />);
    expect(screen.queryByRole('button', { name: /re-auditar/i })).not.toBeInTheDocument();
  });

  it('invoca onReauditar con la llamadaId al pulsar el botón de re-auditar', async () => {
    const onReauditar = vi.fn();
    render(
      <HistorialAuditorias auditorias={AUDITORIAS} llamadaId="llamada-1" onReauditar={onReauditar} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /re-auditar/i }));

    expect(onReauditar).toHaveBeenCalledTimes(1);
    expect(onReauditar).toHaveBeenCalledWith('llamada-1');
  });

  it('ofrece re-auditar aunque la llamada no tenga auditorías previas', () => {
    render(<HistorialAuditorias auditorias={[]} llamadaId="llamada-1" onReauditar={vi.fn()} />);
    expect(screen.getByRole('button', { name: /re-auditar/i })).toBeInTheDocument();
    expect(screen.getByText(/no tiene auditor[ií]as registradas/i)).toBeInTheDocument();
  });

  it('deshabilita el botón y muestra el progreso mientras se re-audita', () => {
    render(
      <HistorialAuditorias
        auditorias={AUDITORIAS}
        llamadaId="llamada-1"
        onReauditar={vi.fn()}
        reauditando
      />,
    );
    expect(screen.getByRole('button', { name: /re-auditando/i })).toBeDisabled();
  });

  it('no muestra controles de comparación si no se proporciona onComparar', () => {
    render(<HistorialAuditorias auditorias={AUDITORIAS} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /comparar/i })).not.toBeInTheDocument();
  });

  it('invoca onComparar con las dos auditorías seleccionadas, la más antigua primero', async () => {
    const onComparar = vi.fn();
    render(<HistorialAuditorias auditorias={AUDITORIAS} onComparar={onComparar} />);

    const casillas = screen.getAllByRole('checkbox');
    await userEvent.click(casillas[1]!); // selecciona la segunda primero
    await userEvent.click(casillas[0]!);
    await userEvent.click(screen.getByRole('button', { name: /comparar/i }));

    expect(onComparar).toHaveBeenCalledTimes(1);
    expect(onComparar).toHaveBeenCalledWith('aud-1', 'aud-2');
  });

  it('mantiene deshabilitado el botón de comparar hasta que hay exactamente dos seleccionadas', async () => {
    render(<HistorialAuditorias auditorias={AUDITORIAS} onComparar={vi.fn()} />);

    expect(screen.getByRole('button', { name: /comparar/i })).toBeDisabled();
    await userEvent.click(screen.getAllByRole('checkbox')[0]!);
    expect(screen.getByRole('button', { name: /comparar/i })).toBeDisabled();
    await userEvent.click(screen.getAllByRole('checkbox')[1]!);
    expect(screen.getByRole('button', { name: /comparar/i })).toBeEnabled();
  });
});
