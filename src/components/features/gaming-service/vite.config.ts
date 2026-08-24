import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(frontendRoot, '../../../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appRoot, '');
  const gamingApi =
    env.GAMING_API_PROXY_TARGET ||
    env.VITE_GAMING_API_TARGET ||
    process.env.GAMING_API_PROXY_TARGET ||
    'http://127.0.0.1:8002';

  return {
    root: frontendRoot,
    publicDir: 'public',
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: gamingApi,
          changeOrigin: true,
          timeout: 60000,
        },
      },
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: gamingApi,
          changeOrigin: true,
          timeout: 60000,
        },
      },
    },
  };
});
