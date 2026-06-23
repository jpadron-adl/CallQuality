# CallQuality · Dashboard del Profesor

Interfaz web para auditar llamadas y revisar el cumplimiento de los protocolos de calidad.
Consume la API HTTP del backend (`src/infrastructure/web`) y no contiene lógica de negocio:
toda la evaluación se calcula en el dominio y se sirve ya serializada como DTOs.

## Stack

- **Vite + React 19 + TypeScript** (`strict`).
- **Tailwind CSS v4** con componentes de estilo **Shadcn/ui**.
- **Vitest + Testing Library** para las pruebas (TDD).

## Arquitectura

- `src/api/` — cliente de la API (`crearClienteAuditoria`), tipos DTO (espejo del contrato del backend) y `ApiError`. El `fetch` y la `baseUrl` se inyectan para poder probar sin red.
- `src/components/` — vistas presentacionales (`ListaLlamadas`, `DetalleAuditoria`) y componentes base de UI (`ui/`). No conocen la API ni el estado.
- `src/App.tsx` — composición maestro-detalle que orquesta el cliente y el estado de la interfaz.
- `src/lib/` — utilidades puras (`cn`, `formatearFechaHora`).

## Puesta en marcha

Requiere la API del backend en marcha. Desde la **raíz del repositorio**:

```bash
npm run dev:api          # levanta la API en http://127.0.0.1:3000 (modo demo por defecto)
```

En otra terminal, dentro de `web/`:

```bash
npm install
npm run dev              # dashboard en http://127.0.0.1:5173 (proxy /api → :3000)
```

## Comandos

- `npm run dev` — servidor de desarrollo con proxy a la API.
- `npm run test` — ejecuta la suite de pruebas (Vitest).
- `npm run test:watch` — pruebas en modo vigilancia.
- `npm run build` — compila el bundle de producción.
- `npm run lint` — comprobación de tipos (`tsc --noEmit`).
