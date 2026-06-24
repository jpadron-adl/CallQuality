import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // node:sqlite es un módulo nativo reciente que Node oculta de `builtinModules`
  // por ser experimental; por eso Vite no lo reconoce como built-in e intenta
  // resolverlo en disco. Se expone como módulo virtual que lo carga en tiempo de
  // ejecución vía createRequire (sí disponible en Node), evitando la resolución de Vite.
  plugins: [
    {
      name: 'cargar-node-sqlite-nativo',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'node:sqlite' || id === 'sqlite') {
          return '\0node-sqlite-virtual';
        }
        return null;
      },
      load(id) {
        if (id === '\0node-sqlite-virtual') {
          return [
            "import { createRequire } from 'node:module';",
            'const require = createRequire(import.meta.url);',
            "const nativo = require('node:sqlite');",
            'export const DatabaseSync = nativo.DatabaseSync;',
            'export default nativo;',
          ].join('\n');
        }
        return null;
      },
    },
  ],
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@application': fileURLToPath(new URL('./src/application', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
    },
  },
});
