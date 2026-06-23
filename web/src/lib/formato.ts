const FORMATEADOR = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

/**
 * Formatea una fecha ISO a `DD/MM/AAAA, HH:MM` en zona UTC para una presentación
 * estable e independiente de la zona horaria del navegador. Si la cadena no es una
 * fecha válida, la devuelve sin alterar para no ocultar datos al profesor.
 */
export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }
  return FORMATEADOR.format(fecha);
}
