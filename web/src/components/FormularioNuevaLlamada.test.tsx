import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormularioNuevaLlamada } from '@/components/FormularioNuevaLlamada';

describe('FormularioNuevaLlamada', () => {
  it('muestra el campo de agente y una intervención inicial', () => {
    render(<FormularioNuevaLlamada onRegistrar={vi.fn()} />);
    expect(screen.getByLabelText(/identificador del agente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/texto de la intervención 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rol de la intervención 1/i)).toBeInTheDocument();
  });

  it('permite añadir y quitar intervenciones', async () => {
    render(<FormularioNuevaLlamada onRegistrar={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /añadir intervención/i }));
    expect(screen.getByLabelText(/texto de la intervención 2/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /quitar intervención 2/i }));
    expect(screen.queryByLabelText(/texto de la intervención 2/i)).not.toBeInTheDocument();
  });

  it('al enviar invoca onRegistrar con el agente y las intervenciones', async () => {
    const onRegistrar = vi.fn();
    render(<FormularioNuevaLlamada onRegistrar={onRegistrar} />);

    await userEvent.type(screen.getByLabelText(/identificador del agente/i), 'agente-099');
    await userEvent.selectOptions(screen.getByLabelText(/rol de la intervención 1/i), 'CLIENTE');
    await userEvent.type(screen.getByLabelText(/texto de la intervención 1/i), 'Tengo una consulta');

    await userEvent.click(screen.getByRole('button', { name: /registrar llamada/i }));

    expect(onRegistrar).toHaveBeenCalledTimes(1);
    expect(onRegistrar).toHaveBeenCalledWith({
      agenteId: 'agente-099',
      intervenciones: [{ rol: 'CLIENTE', texto: 'Tengo una consulta' }],
    });
  });

  it('no envía si el agente o el texto están vacíos (botón deshabilitado)', () => {
    const onRegistrar = vi.fn();
    render(<FormularioNuevaLlamada onRegistrar={onRegistrar} />);
    expect(screen.getByRole('button', { name: /registrar llamada/i })).toBeDisabled();
  });

  it('deshabilita el botón y muestra el progreso mientras se registra', () => {
    render(<FormularioNuevaLlamada onRegistrar={vi.fn()} registrando />);
    expect(screen.getByRole('button', { name: /registrando/i })).toBeDisabled();
  });
});
