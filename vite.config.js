import { defineConfig } from 'vite';

export default defineConfig({
  base: '/tic-tac-toe/',
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
});
