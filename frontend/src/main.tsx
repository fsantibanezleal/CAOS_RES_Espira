import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { applyTheme, readTheme } from '@fasl-work/caos-app-shell';
import '@fasl-work/caos-app-shell/styles.css';
import './styles.css';
import { App } from './App';

// Vite's relative base is '.' or './' on a project site; React Router needs a real path basename.
// Strip a leading '.' so '/./' does not fail to match '/'.
function normalizeBase(base: string): string {
  const trimmed = base.replace(/\/$/, '');
  if (trimmed === '' || trimmed === '.') return '/';
  return trimmed.startsWith('.') ? trimmed.slice(1) || '/' : trimmed;
}

// Apply the persisted or system theme on first paint; the shell's toggle keeps it in sync after.
applyTheme(readTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={normalizeBase(import.meta.env.BASE_URL)}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
