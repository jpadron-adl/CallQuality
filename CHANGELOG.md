# Changelog

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.13.0] - 2026-06-26

### Added
- Revisión humana de las auditorías (human-in-the-loop), desarrollada con TDD estricto (micro-commits rojo-verde-refactor) a través de todas las capas: la IA propone y el supervisor dispone. Un revisor puede confirmar una auditoría, dejar un comentario y **corregir el veredicto del LLM protocolo a protocolo**; se conserva siempre la evaluación original del modelo (trazabilidad) y la puntuación se recalcula sobre las evaluaciones efectivas.
  - Dominio: nuevo value object `RevisionAuditoria` y comportamiento `revisar()` en el agregado `ResultadoAuditoria`, que valida que las correcciones se refieran a protocolos realmente evaluados y expone `evaluacionesEfectivas()`; la puntuación pasa a calcularse sobre ellas.
  - Aplicación: caso de uso `RevisarAuditoria` y nuevo método de puerto `AuditoriaRepository.obtenerPorId`. El adaptador en memoria adopta semántica de upsert por identidad para no duplicar la auditoría revisada.
  - Infraestructura: persistencia de la revisión en SQLite (columna `revision` JSON con migración idempotente para bases ya existentes); el mapeador la serializa y rehidrata.
  - API HTTP: nueva ruta `POST /api/auditorias/:id/revision` (validada con Zod; 404 si la auditoría no existe y 400 ante datos de dominio inválidos). El DTO de auditoría incorpora la revisión y expone las evaluaciones efectivas.
  - Dashboard: `FormularioRevision` (identifica al revisor, comentario y corrección del veredicto por protocolo), sello de revisión en `DetalleAuditoria` y orquestación en `App` del flujo revisar → recargar el historial desde el detalle expandido de cada auditoría.

## [0.12.0] - 2026-06-26

### Changed
- Reformulada la ingesta de llamadas: en lugar de teclear la transcripción turno a turno, el usuario sube un fichero JSON con la conversación completa. El contrato de alta (`POST /api/llamadas`) pasa a usar el campo `transcripcion` en lugar de `intervenciones`, unificándose con el formato de las llamadas sintéticas (`llamadas-demo.json`); así un fichero de ejemplo puede subirse tal cual. Un `id` u otras claves presentes en el fichero se ignoran (el identificador lo genera el sistema). El comando interno del caso de uso `RegistrarLlamada` sigue hablando de `intervenciones` (lenguaje de la aplicación): la traducción ocurre en la frontera HTTP.
- Dashboard: el formulario manual `FormularioNuevaLlamada` se sustituye por el componente `CargaLlamadaJson`, que lee y valida el fichero en el cliente (JSON mal formado o forma inesperada se notifican con un mensaje claro), muestra un resumen (agente y número de intervenciones) y delega el alta en su contenedor.

### Added
- Ficheros de ejemplo en `ejemplos/llamadas/` (cinco escenarios: llamada ejemplar, cliente conflictivo, sin saludo ni despedida, lenguaje ofensivo del cliente y reclamación formal) con un `README.md` que documenta el formato y el resultado esperado de cada uno en modo demo. Pensados para que el usuario los suba directamente desde el dashboard.

### Removed
- Componente `FormularioNuevaLlamada` (alta turno a turno), reemplazado por la carga de fichero JSON.

## [0.11.0] - 2026-06-24

### Added
- Ingesta de llamadas reales a partir de su transcripción textual (desarrollada con TDD, 22 tests nuevos en el backend y 8 en el dashboard), primer paso de la incorporación de llamadas más allá de los datos sintéticos:
  - Aplicación: nuevo caso de uso `RegistrarLlamada`, que da de alta una llamada a partir de una transcripción ya textual y diarizada (rol + texto por turno). La fecha de inicio es opcional: en su ausencia se toma del puerto `Reloj`. Las invariantes (roles del catálogo, textos no vacíos, al menos una intervención) las garantiza el dominio al construir los value objects.
  - API HTTP: nueva ruta `POST /api/llamadas`. El contrato `PeticionHttp` transporta ahora un cuerpo opcional ya deserializado; `ApiAuditoria` valida el payload con Zod (400 si la forma es inválida) y mapea los `DomainError` (p. ej. un rol fuera del catálogo) a 400 en lugar de filtrarlos como error interno. El adaptador de borde `ServidorHttp` lee y deserializa el cuerpo JSON entrante (400 ante un cuerpo mal formado).
  - Dashboard: nuevo formulario `FormularioNuevaLlamada` (vista presentacional con lista dinámica de intervenciones) y método `registrarLlamada` en el cliente. `App` orquesta el flujo registrar → recargar el listado, que refleja la nueva llamada sin recargar la página.
- Decisión de alcance: la ingesta desde audio (ASR + diarización tras un futuro puerto `TranscriptorAudio`) queda como fase posterior, construida sobre esta ingesta textual.

## [0.10.0] - 2026-06-24

### Added
- Persistencia real sobre SQLite (desarrollada con TDD, 25 tests nuevos), de modo que las llamadas y, sobre todo, las auditorías sobreviven a los reinicios. Implementada como adaptadores de los puertos ya existentes (`LlamadaRepository` y `AuditoriaRepository`), sin modificar el dominio ni la aplicación:
  - Motor SQLite nativo de Node (`node:sqlite`), sin dependencias externas nuevas, en coherencia con el uso de `node:http` para la API.
  - Adaptadores `LlamadaRepositorySqlite` y `AuditoriaRepositorySqlite` con una conexión `DatabaseSync` inyectada y compartida; el `INSERT … ON CONFLICT` da semántica de upsert por identidad.
  - Esquema relacional idempotente (`crearEsquema`) con una tabla por agregado e integridad referencial; las colecciones internas (transcripción, evaluaciones y alertas) se almacenan como JSON, persistiendo cada agregado como una unidad.
  - Mapeadores de ida y vuelta (dominio ↔ fila): la rehidratación trata los datos del almacén como no confiables (validación con Zod en la frontera y reconstrucción mediante las fábricas del dominio), y traduce cualquier incompatibilidad a `PersistenciaCorruptaError`.
  - Configuración por entorno: `PERSISTENCIA=memoria|sqlite` (por defecto `memoria`) y `DB_PATH` (por defecto `callquality.sqlite`). El Composite Root selecciona el adaptador y siembra las llamadas sintéticas solo si el almacén está vacío (primer arranque), conservando las auditorías acumuladas.

### Changed
- `vitest.config.ts` carga `node:sqlite` mediante un módulo virtual (`createRequire`), ya que Node lo oculta de `builtinModules` por ser experimental y Vite intentaba resolverlo en disco.

## [0.9.1] - 2026-06-23

### Fixed
- La vista de detalle (`DetalleAuditoria`) no mostraba la fecha en que se realizó la auditoría. Ahora la indica junto a la puntuación, de modo que la fecha es visible tanto al auditar como al expandir una auditoría del historial.

## [0.9.0] - 2026-06-23

### Added
- Reauditación desde el dashboard (desarrollada con TDD): la vista de historial ofrece un botón «Re-auditar» que vuelve a auditar la llamada y recarga el historial para mostrar la nueva pasada (cada auditoría conserva su fecha, lo que permite distinguir y ordenar las sucesivas ejecuciones).
  - `HistorialAuditorias` acepta `llamadaId`, `onReauditar` y `reauditando`, mostrando el botón —con su estado de progreso— incluso cuando la llamada no tiene auditorías previas.
  - `App` orquesta el flujo (auditar → recargar el historial) y gestiona su estado de progreso y de error.

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
