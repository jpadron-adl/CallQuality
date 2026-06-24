import { describe, it, expect } from 'vitest';
import {
  serializarAuditoria,
  deserializarAuditoria,
} from '@infrastructure/persistence/sqlite/MapeadorAuditoria';
import { PersistenciaCorruptaError } from '@infrastructure/persistence/sqlite/PersistenciaCorruptaError';
import { ResultadoAuditoria } from '@domain/auditoria/ResultadoAuditoria';
import { AuditoriaId } from '@domain/auditoria/value-objects/AuditoriaId';
import { EvaluacionProtocolo } from '@domain/auditoria/value-objects/EvaluacionProtocolo';
import { TipoProtocolo } from '@domain/auditoria/value-objects/TipoProtocolo';
import { AlertaCumplimiento } from '@domain/auditoria/value-objects/AlertaCumplimiento';
import { TipoAlerta } from '@domain/auditoria/value-objects/TipoAlerta';
import { SeveridadAlerta } from '@domain/auditoria/value-objects/SeveridadAlerta';
import { Evidencia } from '@domain/auditoria/value-objects/Evidencia';
import { LlamadaId } from '@domain/llamada/value-objects/LlamadaId';

const auditoriaEjemplo = (): ResultadoAuditoria =>
  ResultadoAuditoria.crear({
    id: AuditoriaId.crear('auditoria-1'),
    llamadaId: LlamadaId.crear('llamada-1'),
    fechaAuditoria: new Date('2026-06-24T11:00:00.000Z'),
    evaluaciones: [
      EvaluacionProtocolo.crear(
        TipoProtocolo.SALUDO_INICIAL,
        true,
        Evidencia.crear('Buenos días, le atiende Ana'),
      ),
      EvaluacionProtocolo.crear(
        TipoProtocolo.DESPEDIDA,
        false,
        Evidencia.crear('No se detecta despedida'),
      ),
    ],
    alertas: [
      AlertaCumplimiento.crear(
        TipoAlerta.AMENAZA,
        SeveridadAlerta.ALTA,
        Evidencia.crear('Le voy a denunciar'),
      ),
    ],
  });

describe('MapeadorAuditoria', () => {
  it('serializa el resultado a una fila plana con evaluaciones y alertas como JSON', () => {
    const fila = serializarAuditoria(auditoriaEjemplo());

    expect(fila.id).toBe('auditoria-1');
    expect(fila.llamadaId).toBe('llamada-1');
    expect(fila.fechaAuditoria).toBe('2026-06-24T11:00:00.000Z');
    expect(JSON.parse(fila.evaluaciones)).toEqual([
      { protocolo: 'SALUDO_INICIAL', cumplido: true, evidencia: 'Buenos días, le atiende Ana' },
      { protocolo: 'DESPEDIDA', cumplido: false, evidencia: 'No se detecta despedida' },
    ]);
    expect(JSON.parse(fila.alertas)).toEqual([
      { tipo: 'AMENAZA', severidad: 'ALTA', evidencia: 'Le voy a denunciar' },
    ]);
  });

  it('reconstruye el resultado equivalente al deserializar (ida y vuelta)', () => {
    const original = auditoriaEjemplo();

    const reconstruido = deserializarAuditoria(serializarAuditoria(original));

    expect(reconstruido.esIgualA(original)).toBe(true);
    expect(reconstruido.llamadaId.esIgualA(original.llamadaId)).toBe(true);
    expect(reconstruido.fechaAuditoria.getTime()).toBe(original.fechaAuditoria.getTime());
    expect(reconstruido.puntuacion().valor).toBe(original.puntuacion().valor);
    expect(reconstruido.evaluaciones).toHaveLength(2);
    expect(reconstruido.evaluaciones[0]?.tipo.valor).toBe('SALUDO_INICIAL');
    expect(reconstruido.evaluaciones[0]?.cumplido).toBe(true);
    expect(reconstruido.alertas).toHaveLength(1);
    expect(reconstruido.alertas[0]?.severidad.valor).toBe('ALTA');
  });

  it('admite un resultado sin alertas', () => {
    const sinAlertas = ResultadoAuditoria.crear({
      id: AuditoriaId.crear('auditoria-2'),
      llamadaId: LlamadaId.crear('llamada-1'),
      fechaAuditoria: new Date('2026-06-24T12:00:00.000Z'),
      evaluaciones: [
        EvaluacionProtocolo.crear(TipoProtocolo.SALUDO_INICIAL, true, Evidencia.crear('Hola')),
      ],
      alertas: [],
    });

    const reconstruido = deserializarAuditoria(serializarAuditoria(sinAlertas));

    expect(reconstruido.tieneAlertas()).toBe(false);
    expect(reconstruido.evaluaciones).toHaveLength(1);
  });

  it('lanza PersistenciaCorruptaError si las evaluaciones almacenadas no son JSON válido', () => {
    const fila = { ...serializarAuditoria(auditoriaEjemplo()), evaluaciones: 'roto' };

    expect(() => deserializarAuditoria(fila)).toThrow(PersistenciaCorruptaError);
  });

  it('lanza PersistenciaCorruptaError si un protocolo almacenado es ajeno al catálogo', () => {
    const fila = {
      ...serializarAuditoria(auditoriaEjemplo()),
      evaluaciones: JSON.stringify([
        { protocolo: 'INVENTADO', cumplido: true, evidencia: 'x' },
      ]),
    };

    expect(() => deserializarAuditoria(fila)).toThrow(PersistenciaCorruptaError);
  });
});
