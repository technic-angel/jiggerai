import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/app.ts',
        'src/agents/orchestrator.ts',
        'src/agents/subagents.ts',
        'src/agents/memory.ts',
        'src/agents/providers.ts',
        'src/agents/tools/**',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
