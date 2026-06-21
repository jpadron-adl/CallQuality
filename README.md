# CallQuality

**Sistema Automatizado de Auditoría de Calidad y Cumplimiento para Call Centers.**

El sistema procesa transcripciones de llamadas entre
clientes y agentes, audita el cumplimiento de los protocolos de la empresa (saludo,
validación de identidad, oferta obligatoria, lenguaje adecuado, despedida) y detecta
alertas de cumplimiento (fraude, queja grave, amenaza, lenguaje ofensivo) apoyándose
en Modelos de Lenguaje (LLMs), de forma totalmente desacoplada del proveedor.

## Arquitectura

El proyecto sigue **Clean Architecture** estricta, con inversión de dependencias real:
las capas internas no conocen a las externas y la IA se abstrae tras un puerto del dominio.

```
src/
├── domain/          Lógica de negocio pura. Cero dependencias de infraestructura.
│   ├── llamada/         Agregado Llamada + value objects + puerto de repositorio.
│   ├── auditoria/       Agregado ResultadoAuditoria + value objects + puertos.
│   └── shared/          ValueObject base, DomainError, puerto GeneradorId.
├── application/     Casos de uso. Solo depende de interfaces del dominio.
│   └── use-cases/       AuditarLlamada.
└── infrastructure/  Adaptadores concretos (se inyectan según APP_MODE).
    ├── ia/              MockAnalisisService (análisis determinista del modo demo).
    ├── persistence/     Repositorios en memoria.
    ├── data/            Cargador de datos sintéticos con validación Zod.
    ├── id/              GeneradorIdUuid.
    └── config/          Composite Root (wiring por APP_MODE).
```

### Principios aplicados

- **DDD táctico**: entidades, agregados, value objects, repositorios y servicios como puertos.
- **SOLID** e inversión de dependencias: los puertos viven en el dominio; la infraestructura los implementa.
- **Desacoplamiento de la IA**: el dominio no conoce OpenAI, Anthropic ni ningún SDK.
- **TDD estricto**: todo el código de producción nace de un test previo (ciclo rojo → verde → refactor).

## Stack tecnológico

- **Lenguaje**: TypeScript (`strict`, ESM nativo).
- **Runtime**: Node.js >= 20.
- **Testing**: Vitest.
- **Validación de datos**: Zod (frontera de infraestructura).
- **Cliente de IA (producción)**: SDK de OpenAI *(pendiente de implementación)*.

## Modo Demo (sin API keys)

El sistema se ejecuta y evalúa al 100% sin claves de API mediante `APP_MODE=demo`,
que inyecta adaptadores en memoria y un análisis determinista por palabras clave sobre
datos sintéticos locales.

```bash
APP_MODE=demo npm run dev
```

## Comandos

```bash
npm install          # Instalar dependencias
npm test             # Ejecutar la suite de tests (Vitest)
npm run test:watch   # Tests en modo observación
npm run lint         # Comprobación de tipos (tsc --noEmit)
npm run dev          # Ejecutar la demostración por consola (usar con APP_MODE)
```

## Versionado

El proyecto sigue [SemVer](https://semver.org/lang/es/) y mantiene un
[CHANGELOG](CHANGELOG.md) bajo la convención *Keep a Changelog*.
