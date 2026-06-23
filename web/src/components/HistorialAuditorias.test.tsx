import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistorialAuditorias } from '@/components/HistorialAuditorias';
import type { ResultadoAuditoriaDto } from '@/api/tipos';

function auditoria(id: string, puntuacion: number, tieneAlertas = false): ResultadoAuditoriaDto {
  return {
    id,
    llamadaId: 'llamada-1',
    puntuacion,
    tieneAlertas,
    evaluaciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días...' }],
    alertas: tieneAlertas ? [{ tipo: 'LENGUAJE_INADECUADO', severidad: 'ALTA', evidencia: '...' }] : [],
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
});
