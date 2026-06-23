import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Desmonta el árbol de React tras cada test para aislar los casos.
afterEach(() => {
  cleanup();
});
