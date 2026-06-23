import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/index.css';

const contenedor = document.getElementById('root');
if (contenedor === null) {
  throw new Error('No se ha encontrado el elemento raíz #root.');
}

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
