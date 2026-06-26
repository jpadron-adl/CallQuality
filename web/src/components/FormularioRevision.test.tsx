import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormularioRevision } from '@/components/FormularioRevision';
import type { ResultadoAuditoriaDto } from '@/api/tipos';

const RESULTADO: ResultadoAuditoriaDto = {
  id: 'auditoria-1',
  llamadaId: 'llamada-1',
  fechaAuditoria: '2026-06-20T09:05:00.000Z',
  puntuacion: 50,
  tieneAlertas: false,
  evaluaciones: [
    { protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días' },
    { protocolo: 'DESPEDIDA', cumplido: false, evidencia: 'No se despide' },
  ],
  alertas: [],
  revision: null,
};

describe('FormularioRevision', () => {
  it('muestra los campos de revisor y comentario', () => {
    render(<FormularioRevision resultado={RESULTADO} onRevisar={vi.fn()} />);
    expect(screen.getByLabelText(/revisor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comentario/i)).toBeInTheDocument();
  });

  it('al guardar sin correcciones invoca onRevisar con el revisor', async () => {
    const onRevisar = vi.fn();
    render(<FormularioRevision resultado={RESULTADO} onRevisar={onRevisar} />);

    await userEvent.type(screen.getByLabelText(/revisor/i), 'supervisor-01');
    await userEvent.click(screen.getByRole('button', { name: /guardar revisión/i }));

    expect(onRevisar).toHaveBeenCalledWith(
      'auditoria-1',
      expect.objectContaining({ revisor: 'supervisor-01', correcciones: [] }),
    );
  });

  it('permite corregir un protocolo y lo envía como corrección', async () => {
    const onRevisar = vi.fn();
    render(<FormularioRevision resultado={RESULTADO} onRevisar={onRevisar} />);

    await userEvent.type(screen.getByLabelText(/revisor/i), 'supervisor-01');
    await userEvent.click(screen.getByLabelText(/corregir despedida/i));
    await userEvent.type(
      screen.getByLabelText(/evidencia de la corrección de despedida/i),
      'Sí se despide al final',
    );
    await userEvent.click(screen.getByRole('button', { name: /guardar revisión/i }));

    expect(onRevisar).toHaveBeenCalledWith('auditoria-1', {
      revisor: 'supervisor-01',
      correcciones: [{ protocolo: 'DESPEDIDA', cumplido: true, evidencia: 'Sí se despide al final' }],
    });
  });

  it('mantiene el botón deshabilitado mientras no haya revisor', () => {
    render(<FormularioRevision resultado={RESULTADO} onRevisar={vi.fn()} />);
    expect(screen.getByRole('button', { name: /guardar revisión/i })).toBeDisabled();
  });

  it('deshabilita el botón y muestra el progreso mientras se revisa', () => {
    render(<FormularioRevision resultado={RESULTADO} onRevisar={vi.fn()} revisando />);
    expect(screen.getByRole('button', { name: /guardando/i })).toBeDisabled();
  });
});
