# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.2.0] - 2026-06-21

### Added
- Andamiaje inicial del proyecto: TypeScript ESM con `strict`, Vitest y estructura de Clean Architecture.
- Modelo de dominio completo del contexto `AuditoríaDeCalidad`, desarrollado con TDD estricto (89 tests):
  - Agregado `Llamada` con sus value objects `LlamadaId`, `IntervinienteRol`, `Intervencion` y `Transcripcion`.
  - Agregado `ResultadoAuditoria` con `AuditoriaId`, `EvaluacionProtocolo`, `TipoProtocolo`, `Evidencia`, `AlertaCumplimiento`, `TipoAlerta`, `SeveridadAlerta` y `PuntuacionCalidad`.
  - Cálculo de la puntuación de calidad en el dominio como porcentaje de protocolos cumplidos.
  - Clase base `ValueObject` y excepción `DomainError` compartidas.
