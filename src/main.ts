import { leerConfig } from '@infrastructure/config/AppConfig';
import { construirContexto } from '@infrastructure/config/construirContexto';

/**
 * Punto de entrada de demostración. Audita todas las llamadas disponibles e
 * imprime un informe por consola. En Modo Demo (APP_MODE=demo) funciona al 100%
 * sin API keys, usando datos sintéticos y análisis determinista.
 */
async function main(): Promise<void> {
  const config = leerConfig();
  const { auditarLlamada, llamadas } = construirContexto(config);

  console.log(`\n=== Auditoría de Calidad de Call Center (modo: ${config.modo}) ===\n`);

  const pendientes = await llamadas.listarPendientesDeAuditar();
  for (const llamada of pendientes) {
    const resultado = await auditarLlamada.ejecutar(llamada.id);

    console.log(`Llamada ${llamada.id.valor} — agente ${llamada.agenteId}`);
    console.log(`  Puntuación de calidad: ${resultado.puntuacion().valor}/100`);

    for (const evaluacion of resultado.evaluaciones) {
      const marca = evaluacion.cumplido ? '✓' : '✗';
      console.log(`    ${marca} ${evaluacion.tipo.valor}`);
    }

    if (resultado.tieneAlertas()) {
      const masGrave = resultado.alertaMasGrave();
      console.log(`  ⚠ Alertas (${resultado.alertas.length}); más grave: ${masGrave?.tipo.valor} [${masGrave?.severidad.valor}]`);
      for (const alerta of resultado.alertas) {
        console.log(`      - ${alerta.tipo.valor} [${alerta.severidad.valor}]: "${alerta.evidencia.valor}"`);
      }
    } else {
      console.log('  Sin alertas de cumplimiento.');
    }
    console.log('');
  }
}

main().catch((error: unknown) => {
  console.error('La ejecución de la auditoría ha fallado:', error);
  process.exitCode = 1;
});
