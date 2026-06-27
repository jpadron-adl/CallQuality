import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparacionAuditorias } from '@/components/ComparacionAuditorias';
import type { ComparacionAuditoriasDto } from '@/api/tipos';

const COMPARACION: ComparacionAuditoriasDto = {
  llamadaId: 'llamada-1',
  auditoriaIdA: 'a1',
  auditoriaIdB: 'a2',
  puntuacionA: 50,
  puntuacionB: 100,
  diferenciaPuntuacion: 50,
  protocolosCambiados: [{ protocolo: 'DESPEDIDA', cumplidoA: false, cumplidoB: true }],
  alertasAparecidas: [{ tipo: 'FRAUDE', severidad: 'ALTA' }],
  alertasDesaparecidas: [{ tipo: 'QUEJA_GRAVE', severidad: 'MEDIA' }],
};

describe('ComparacionAuditorias', () => {
  it('muestra las dos puntuaciones y la diferencia con signo', () => {
    render(<ComparacionAuditorias comparacion={COMPARACION} />);
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
    expect(screen.getByText('100 / 100')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
  });

  it('lista los protocolos cuyo veredicto cambió con su transición', () => {
    render(<ComparacionAuditorias comparacion={COMPARACION} />);
    expect(screen.getByText('DESPEDIDA')).toBeInTheDocument();
    expect(screen.getByText(/Incumplido.*Cumplido/i)).toBeInTheDocument();
  });

  it('muestra las alertas aparecidas y desaparecidas', () => {
    render(<ComparacionAuditorias comparacion={COMPARACION} />);
    expect(screen.getByText('FRAUDE')).toBeInTheDocument();
    expect(screen.getByText('QUEJA_GRAVE')).toBeInTheDocument();
  });

  it('indica la ausencia de cambios cuando las dos auditorías coinciden', () => {
    render(
      <ComparacionAuditorias
        comparacion={{
          ...COMPARACION,
          puntuacionA: 100,
          puntuacionB: 100,
          diferenciaPuntuacion: 0,
          protocolosCambiados: [],
          alertasAparecidas: [],
          alertasDesaparecidas: [],
        }}
      />,
    );
    expect(screen.getByText(/sin diferencias/i)).toBeInTheDocument();
  });
});
