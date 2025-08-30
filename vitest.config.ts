/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: './tests/setup.ts',
    env: {
      ENCRYPTION_KEY: 'MHulhjW7FLQolEQgi1TU8elXnnUFt0arg/I/bb9HeLo=',
      NEXTAUTH_SECRET: 'test_secret_for_testing_only',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
