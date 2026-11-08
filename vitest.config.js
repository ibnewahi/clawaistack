import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Tests must not load application environment files or initialize real clients.
  envDir: false,
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/frontend/**/*.test.jsx'],
    setupFiles: ['./tests/frontend/setup.js'],
    clearMocks: true,
    restoreMocks: true,
    fileParallelism: false,
  },
});
