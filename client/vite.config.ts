import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(process.cwd(), '..');
  const env = { ...loadEnv(mode, rootEnvDir, ''), ...process.env };
  return {
    envDir: rootEnvDir,
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue()],
    server: {
      port: 3001
    }
  };
});
