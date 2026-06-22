import { leerConfig } from '@infrastructure/config/AppConfig';
import { construirContexto } from '@infrastructure/config/construirContexto';
import { ApiAuditoria } from '@infrastructure/web/ApiAuditoria';
import { ServidorHttp } from '@infrastructure/web/ServidorHttp';

/**
 * Punto de entrada del servidor de la API de auditoría. Expone los casos de uso por
 * HTTP para que el dashboard del profesor (u otro cliente) los consuma. En Modo Demo
 * funciona sin API keys. El puerto se toma de la variable PORT (por defecto 3000).
 */
async function main(): Promise<void> {
  const config = leerConfig();
  const api = new ApiAuditoria(construirContexto(config));
  const servidor = new ServidorHttp(api);

  const puerto = Number(process.env.PORT ?? 3000);
  const puertoReal = await servidor.iniciar(puerto);

  console.log(`API de auditoría escuchando en http://127.0.0.1:${puertoReal} (modo: ${config.modo})`);
  console.log('Rutas: GET /api/llamadas · POST /api/llamadas/:id/auditorias · GET /api/llamadas/:id/auditorias');

  const cerrar = (): void => {
    void servidor.detener().then(() => process.exit(0));
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

main().catch((error: unknown) => {
  console.error('No se ha podido iniciar la API de auditoría:', error);
  process.exitCode = 1;
});
