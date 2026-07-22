import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match the GitHub repo name for Pages to serve assets correctly.
export default defineConfig({
  base: '/soccer-career/',
  plugins: [react()],
});
