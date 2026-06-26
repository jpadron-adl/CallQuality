# Ejemplos de llamadas para dar de alta

Esta carpeta contiene transcripciones de llamadas de ejemplo en el formato que admite el
dashboard. Para registrar una, abre el panel **«Registrar nueva llamada»**, pulsa el
selector de fichero y elige uno de estos `.json`. La llamada aparecerá en la lista de
pendientes, lista para auditar.

## Formato del fichero

Cada fichero contiene **una** llamada como un único objeto JSON:

```json
{
  "agenteId": "agente-021",
  "fechaInicio": "2026-06-25T10:30:00.000Z",
  "transcripcion": [
    { "rol": "AGENTE", "texto": "Buenos días, ¿en qué le ayudo?" },
    { "rol": "CLIENTE", "texto": "Tengo una duda con mi factura." }
  ]
}
```

- **`agenteId`** (obligatorio): identificador del agente que atiende la llamada.
- **`fechaInicio`** (opcional): instante de inicio en formato ISO 8601. Si se omite, el
  sistema usa la fecha del alta.
- **`transcripcion`** (obligatorio): lista de intervenciones, en orden. Cada intervención
  tiene un **`rol`** y un **`texto`** no vacío. Los roles admitidos son `AGENTE`,
  `CLIENTE` y `SISTEMA`.
- Cualquier otra clave (por ejemplo un `id`) se ignora: el identificador de la llamada lo
  genera el sistema.

Es el mismo formato de las llamadas sintéticas
([`src/infrastructure/data/llamadas-demo.json`](../../src/infrastructure/data/llamadas-demo.json)).

## Qué muestra cada ejemplo (en modo demo)

El **modo demo** evalúa con reglas deterministas por palabras clave, de modo que estos
resultados son reproducibles. En **modo producción** el análisis lo realiza el LLM y puede
matizar las valoraciones, pero el formato de entrada es idéntico.

| Fichero | Para qué sirve |
| --- | --- |
| `01-llamada-ejemplar.json` | Cumple todos los protocolos (saludo, validación de identidad, oferta, lenguaje, despedida) y no genera alertas: puntuación alta. |
| `02-cliente-conflictivo.json` | Cliente que menciona estafa y amenaza con denunciar: dispara alertas de fraude y amenaza, con un agente que incumple varios protocolos. |
| `03-sin-saludo-ni-despedida.json` | Agente que va directo al grano: incumple saludo, despedida y oferta. Puntuación baja, sin alertas. |
| `04-cliente-lenguaje-ofensivo.json` | El cliente usa lenguaje ofensivo (alerta), mientras el agente mantiene un trato correcto y valida la identidad. |
| `05-reclamacion-formal.json` | Reclamación encauzada correctamente: alerta de queja y un agente que cumple el protocolo de atención. |
