import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 4821,
    strictPort: true,
  },
  preview: {
    port: 4821,
  },
});
