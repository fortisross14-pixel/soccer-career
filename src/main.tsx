import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initStorage, kvKeys } from './game/storage';

// load saves from IndexedDB before the first render
void initStorage().then(() => {
  (window as unknown as { __xiKeys: () => string[] }).__xiKeys = kvKeys;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
