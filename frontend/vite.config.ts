import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/', // custom domain serves at root; absolute base so deep-link assets resolve
  plugins: [react()],
  test: { environment: 'node', globals: true },
});
