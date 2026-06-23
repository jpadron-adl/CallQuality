import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DetalleAuditoria } from '@/components/DetalleAuditoria';
import type { ResultadoAuditoriaDto } from '@/api/tipos';

const RESULTADO: ResultadoAuditoriaDto = {
  id: 'auditoria-1',
  llamadaId: 'llamada-1',
  fechaAuditoria: '2026-06-20T09:05:00.000Z',
  puntuacion: 75,
  tieneAlertas: true,
  evaluaciones: [
    { protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días, le atiende...' },
    { protocolo: 'DESPEDIDA', cumplido: false, evidencia: 'No consta despedida.' },
  ],
  alertas: [{ tipo: 'LENGUAJE_INADECUADO', severidad: 'ALTA', evidencia: 'Expresión malsonante.' }],
};

describe('DetalleAuditoria', () => {
  it('muestra la puntuación de calidad', () => {
    render(<DetalleAuditoria resultado={RESULTADO} />);
    expect(screen.getByText(/75/)).toBeInTheDocument();
  });

  it('lista cada evaluación con su protocolo, estado de cumplimiento y evidencia', () => {
    render(<DetalleAuditoria resultado={RESULTADO} />);

    expect(screen.getByText('SALUDO_INICIAL')).toBeInTheDocument();
    expect(screen.getByText('Cumplido')).toBeInTheDocument();
    expect(screen.getByText('DESPEDIDA')).toBeInTheDocument();
    expect(screen.getByText('No cumplido')).toBeInTheDocument();
    expect(screen.getByText('Buenos días, le atiende...')).toBeInTheDocument();
  });

  it('lista las alertas con su tipo y severidad', () => {
    render(<DetalleAuditoria resultado={RESULTADO} />);

    const alertas = screen.getByRole('region', { name: /alertas/i });
    expect(within(alertas).getByText('LENGUAJE_INADECUADO')).toBeInTheDocument();
    expect(within(alertas).getByText('ALTA')).toBeInTheDocument();
  });

  it('indica la ausencia de alertas cuando no las hay', () => {
    render(<DetalleAuditoria resultado={{ ...RESULTADO, tieneAlertas: false, alertas: [] }} />);
    expect(screen.getByText(/sin alertas de cumplimiento/i)).toBeInTheDocument();
  });
});
