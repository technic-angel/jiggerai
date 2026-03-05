/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/**',
        'src/store/**',
        'src/hooks/**',
        'src/features/**',
        'src/components/**',
      ],
      exclude: [
        'src/**/*.test.*',
        'src/**/*.spec.*',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        // Seed data files (no logic)
        'src/features/inventory/inventorySeed.ts',
        'src/features/inventory/spiritDetailSeed.ts',
        'src/features/recipes/recipeSeed.ts',
        // Shadcn auto-generated thin wrappers (no app logic)
        'src/components/ui/avatar.tsx',
        'src/components/ui/badge.tsx',
        'src/components/ui/separator.tsx',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 90,
        statements: 99,
      },
    },
  },
});
