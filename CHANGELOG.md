# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.4.0] - 2026-06-22

### Added
- Infraestructura del Modo Producción (`APP_MODE=production`) con análisis semántico por LLM:
  - `OpenAiAnalisisService`: adaptador que construye el prompt, valida la respuesta cruda del LLM con Zod (`respuestaAnalisisSchema`) y la traduce a value objects del dominio.
  - Puerto fino `ClienteChatCompletions` que aísla el SDK del proveedor, y su adaptador de borde `OpenAiChatCompletions` sobre el SDK oficial de OpenAI (salida forzada a JSON con `response_format`).
  - `RespuestaIaInvalidaError`: error de infraestructura que neutraliza el no-determinismo del LLM (respuestas no-JSON, fuera de esquema o con valores ajenos a los catálogos del dominio).
- `leerConfig` resuelve la configuración de OpenAI en modo producción: exige `OPENAI_API_KEY` y resuelve `OPENAI_MODEL` (con valor por defecto).

### Changed
- El Composite Root `construirContexto` selecciona el adaptador de análisis según `APP_MODE` (mock en demo, OpenAI en producción), compartiendo la siembra de llamadas en memoria entre ambos modos.

### Dependencies
- Añadida la dependencia `openai` (SDK oficial) para el cliente de IA en modo producción.

## [0.3.0] - 2026-06-21

### Added
- Capa de aplicación: caso de uso `AuditarLlamada` que orquesta repositorios y servicio de IA contra interfaces, con su error `LlamadaNoEncontradaError`.
- Puerto `GeneradorId` para aislar la generación de identificadores no deterministas.
- Infraestructura del Modo Demo (`APP_MODE=demo`), ejecutable sin API keys:
  - `MockAnalisisService`: análisis determinista por palabras clave.
  - Repositorios en memoria de llamadas y auditorías, y `GeneradorIdUuid`.
  - `CargadorLlamadasSinteticas` con validación Zod y datos sintéticos de ejemplo.
  - Composite Root `construirContexto` con selección de adaptadores por `APP_MODE` y punto de entrada `main.ts`.

## [0.2.0] - 2026-06-21

### Added
- Andamiaje inicial del proyecto: TypeScript ESM con `strict`, Vitest y estructura de Clean Architecture.
- Modelo de dominio completo del contexto `AuditoríaDeCalidad`, desarrollado con TDD estricto (89 tests):
  - Agregado `Llamada` con sus value objects `LlamadaId`, `IntervinienteRol`, `Intervencion` y `Transcripcion`.
  - Agregado `ResultadoAuditoria` con `AuditoriaId`, `EvaluacionProtocolo`, `TipoProtocolo`, `Evidencia`, `AlertaCumplimiento`, `TipoAlerta`, `SeveridadAlerta` y `PuntuacionCalidad`.
  - Cálculo de la puntuación de calidad en el dominio como porcentaje de protocolos cumplidos.
  - Clase base `ValueObject` y excepción `DomainError` compartidas.
