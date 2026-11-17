import { defineConfig, loadEnv } from 'vite';
import { validateClientConfig, securityMeta } from './scripts/security-policy.mjs';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backend = validateClientConfig(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
  return {
    base: '/tic-tac-toe/',
    server: { host: '127.0.0.1', port: 5174, strictPort: true },
    plugins: [{
      name: 'browser-security-policy',
      transformIndexHtml: { order: 'post', handler: html => securityMeta(html, backend, command === 'serve' ? 5174 : null) },
    }],
  };
});
