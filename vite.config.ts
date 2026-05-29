import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/omnipraxis/',
  plugins: [react()],
  server: {
    open: true,
  },
  build: {
    target: 'es2022',
  },
});
