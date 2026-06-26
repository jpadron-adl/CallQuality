import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CargaLlamadaJson } from '@/components/CargaLlamadaJson';

/** Construye un fichero JSON simulado para `userEvent.upload`. */
function ficheroJson(contenido: unknown, nombre = 'llamada.json'): File {
  const texto = typeof contenido === 'string' ? contenido : JSON.stringify(contenido);
  return new File([texto], nombre, { type: 'application/json' });
}

const LLAMADA_VALIDA = {
  agenteId: 'agente-021',
  fechaInicio: '2026-06-25T10:30:00.000Z',
  transcripcion: [
    { rol: 'AGENTE', texto: 'Buenos días, ¿en qué le ayudo?' },
    { rol: 'CLIENTE', texto: 'Tengo una duda con mi factura.' },
  ],
};

describe('CargaLlamadaJson', () => {
  it('muestra el control para seleccionar un fichero JSON', () => {
    render(<CargaLlamadaJson onRegistrar={vi.fn()} />);
    expect(screen.getByLabelText(/fichero de la llamada/i)).toBeInTheDocument();
  });

  it('al subir un fichero válido muestra un resumen y permite registrar', async () => {
    const onRegistrar = vi.fn();
    render(<CargaLlamadaJson onRegistrar={onRegistrar} />);

    await userEvent.upload(screen.getByLabelText(/fichero de la llamada/i), ficheroJson(LLAMADA_VALIDA));

    expect(await screen.findByText(/agente-021/)).toBeInTheDocument();
    expect(screen.getByText(/2 intervenciones/i)).toBeInTheDocument();

    const boton = screen.getByRole('button', { name: /registrar llamada/i });
    expect(boton).toBeEnabled();
    await userEvent.click(boton);

    expect(onRegistrar).toHaveBeenCalledTimes(1);
    expect(onRegistrar).toHaveBeenCalledWith({
      agenteId: 'agente-021',
      fechaInicio: '2026-06-25T10:30:00.000Z',
      transcripcion: [
        { rol: 'AGENTE', texto: 'Buenos días, ¿en qué le ayudo?' },
        { rol: 'CLIENTE', texto: 'Tengo una duda con mi factura.' },
      ],
    });
  });

  it('acepta un fichero sin fecha de inicio (la omite del alta)', async () => {
    const onRegistrar = vi.fn();
    const { fechaInicio: _omitida, ...sinFecha } = LLAMADA_VALIDA;
    render(<CargaLlamadaJson onRegistrar={onRegistrar} />);

    await userEvent.upload(screen.getByLabelText(/fichero de la llamada/i), ficheroJson(sinFecha));
    await userEvent.click(await screen.findByRole('button', { name: /registrar llamada/i }));

    expect(onRegistrar).toHaveBeenCalledWith({
      agenteId: 'agente-021',
      transcripcion: sinFecha.transcripcion,
    });
  });

  it('muestra un error si el fichero no es JSON válido', async () => {
    render(<CargaLlamadaJson onRegistrar={vi.fn()} />);

    await userEvent.upload(screen.getByLabelText(/fichero de la llamada/i), ficheroJson('{ esto no es json'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no es un json v[áa]lido/i);
    expect(screen.getByRole('button', { name: /registrar llamada/i })).toBeDisabled();
  });

  it('muestra un error si el JSON no tiene la forma esperada', async () => {
    render(<CargaLlamadaJson onRegistrar={vi.fn()} />);

    await userEvent.upload(
      screen.getByLabelText(/fichero de la llamada/i),
      ficheroJson({ agenteId: 'agente-1', transcripcion: [] }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(/transcripci[óo]n/i);
    expect(screen.getByRole('button', { name: /registrar llamada/i })).toBeDisabled();
  });

  it('deshabilita el botón y muestra el progreso mientras se registra', async () => {
    render(<CargaLlamadaJson onRegistrar={vi.fn()} registrando />);
    await userEvent.upload(screen.getByLabelText(/fichero de la llamada/i), ficheroJson(LLAMADA_VALIDA));
    expect(await screen.findByRole('button', { name: /registrando/i })).toBeDisabled();
  });
});
