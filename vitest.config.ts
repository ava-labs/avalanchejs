import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
    },
    clearMocks: true,
    root: 'src',
  },
});
