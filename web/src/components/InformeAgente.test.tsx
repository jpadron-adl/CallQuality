import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InformeAgente } from '@/components/InformeAgente';
import type { InformeAgenteDto } from '@/api/tipos';

const INFORME: InformeAgenteDto = {
  agenteId: 'agente-7',
  numeroLlamadasAuditadas: 3,
  puntuacionMedia: 67,
  protocolosMasIncumplidos: [
    { protocolo: 'DESPEDIDA', incumplimientos: 2, evaluaciones: 3 },
    { protocolo: 'SALUDO_INICIAL', incumplimientos: 0, evaluaciones: 3 },
  ],
  totalAlertas: 1,
  alertasPorSeveridad: [{ severidad: 'ALTA', total: 1 }],
};

describe('InformeAgente', () => {
  it('muestra el agente, el número de llamadas auditadas y la puntuación media', () => {
    render(<InformeAgente informe={INFORME} />);
    expect(screen.getByText('agente-7')).toBeInTheDocument();
    expect(screen.getByText(/3 llamadas auditadas/i)).toBeInTheDocument();
    expect(screen.getByText('67 / 100')).toBeInTheDocument();
  });

  it('lista los protocolos más incumplidos con su recuento', () => {
    render(<InformeAgente informe={INFORME} />);
    expect(screen.getByText('DESPEDIDA')).toBeInTheDocument();
    expect(screen.getByText(/2 de 3/i)).toBeInTheDocument();
  });

  it('indica la ausencia de datos cuando el agente no tiene llamadas auditadas', () => {
    render(
      <InformeAgente
        informe={{ ...INFORME, numeroLlamadasAuditadas: 0, protocolosMasIncumplidos: [], totalAlertas: 0, alertasPorSeveridad: [] }}
      />,
    );
    expect(screen.getByText(/sin llamadas auditadas/i)).toBeInTheDocument();
  });
});
