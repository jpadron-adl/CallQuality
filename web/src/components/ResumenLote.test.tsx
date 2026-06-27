import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumenLote } from '@/components/ResumenLote';
import type { ResumenLoteDto, ResultadoAuditoriaDto } from '@/api/tipos';

const RESULTADO: ResultadoAuditoriaDto = {
  id: 'auditoria-1',
  llamadaId: 'llamada-1',
  fechaAuditoria: '2026-06-27T09:05:00.000Z',
  puntuacion: 80,
  tieneAlertas: false,
  evaluaciones: [{ protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días...' }],
  alertas: [],
  revision: null,
};

const RESUMEN: ResumenLoteDto = {
  totalPendientes: 3,
  auditadas: 2,
  fallidas: 1,
  resultados: [RESULTADO],
  fallos: [{ llamadaId: 'llamada-9', motivo: 'El análisis de IA ha fallado para esta llamada.' }],
};

describe('ResumenLote', () => {
  it('muestra el recuento de auditadas y fallidas', () => {
    render(<ResumenLote resumen={RESUMEN} />);
    expect(screen.getByText(/2 auditadas/i)).toBeInTheDocument();
    expect(screen.getByText(/1 fallida/i)).toBeInTheDocument();
  });

  it('lista los fallos con la llamada y el motivo', () => {
    render(<ResumenLote resumen={RESUMEN} />);
    expect(screen.getByText('llamada-9')).toBeInTheDocument();
    expect(screen.getByText(/ha fallado/i)).toBeInTheDocument();
  });

  it('indica cuando no había llamadas pendientes de auditar', () => {
    render(
      <ResumenLote
        resumen={{ totalPendientes: 0, auditadas: 0, fallidas: 0, resultados: [], fallos: [] }}
      />,
    );
    expect(screen.getByText(/no hab[ií]a llamadas pendientes/i)).toBeInTheDocument();
  });
});
