# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.8.0] - 2026-06-23

### Added
- Fecha de auditoría: el resultado de cada auditoría registra el instante en que se realizó, sentando la base para el historial comparable y la reauditación. Desarrollado con TDD a través de todas las capas:
  - Dominio: nuevo puerto `Reloj` que aísla la fuente no determinista del tiempo (análogo a `GeneradorId`), y `fechaAuditoria` (con copia defensiva) en el agregado `ResultadoAuditoria`.
  - Aplicación: `AuditarLlamada` recibe el `Reloj` por inyección y sella el resultado con `reloj.ahora()`.
  - Infraestructura: adaptador `RelojDelSistema` (cableado en el Composite Root) y exposición de `fechaAuditoria` en ISO 8601 en el DTO y el presentador.
  - Dashboard: el `ResultadoAuditoriaDto` incluye `fechaAuditoria` y la vista `HistorialAuditorias` muestra la fecha formateada de cada auditoría.

## [0.7.0] - 2026-06-23

### Added
- Historial de auditorías en el dashboard (desarrollado con TDD, 8 tests nuevos):
  - Vista `HistorialAuditorias`: lista las auditorías previas de una llamada (numeradas por orden de creación) con su puntuación y presencia de alertas, y permite desplegar el detalle completo de cada una de forma independiente. Consume `GET /api/llamadas/:id/auditorias` mediante `listarAuditorias`.
  - `ListaLlamadas` ofrece un botón «Historial» por llamada (vía la nueva prop opcional `onVerHistorial`).
  - `App` modela el panel de detalle como un estado discriminado (vacío, resultado puntual o historial), gestionando la carga del historial y sus errores.

## [0.6.0] - 2026-06-23

### Added
- Dashboard (`web/`): aplicación Vite + React + TypeScript (`strict`) con Tailwind y componentes de estilo Shadcn/ui, desarrollada con TDD (Vitest + Testing Library, 19 tests):
  - Cliente de la API (`auditoriaApi`) con `fetch` y `baseUrl` inyectables, tipos DTO espejo del contrato del backend y `ApiError` que encapsula el estado HTTP.
  - Vista `ListaLlamadas`: lista las llamadas pendientes y lanza su auditoría, con estado «en curso» por llamada.
  - Vista `DetalleAuditoria`: muestra la puntuación de calidad, el cumplimiento protocolo a protocolo con su evidencia y las alertas por severidad.
  - Composición `App` (maestro-detalle) que orquesta el cliente y el estado de la interfaz, con manejo de errores.
  - Componentes base (`Button`, `Card`, `Badge`) y utilidades (`cn`, `formatearFechaHora`).
- Proxy de desarrollo de Vite (`/api` → `127.0.0.1:3000`) para consumir la API sin depender de CORS en local.

## [0.5.0] - 2026-06-22

### Added
- Capa de entrada HTTP (API) que expone los casos de uso para el dashboard, en `src/infrastructure/web/`:
  - Presentadores puros (`presentarLlamada`, `presentarResultadoAuditoria`) que serializan el dominio a DTOs planos, sin exponer value objects.
  - Contrato HTTP agnóstico del servidor (`PeticionHttp`/`RespuestaHttp`).
  - Router `ApiAuditoria` (testeable en memoria) con las rutas `GET /api/llamadas`, `POST /api/llamadas/:id/auditorias` y `GET /api/llamadas/:id/auditorias`, que mapea los errores de aplicación a códigos HTTP (404, 405).
  - Adaptador de borde `ServidorHttp` sobre el módulo `node:http` nativo (sin frameworks externos), con CORS habilitado y puerto configurable.
- Punto de entrada `src/main-api.ts` y script `dev:api` para levantar el servidor de la API.

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
