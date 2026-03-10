import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['bin/clickup.ts'],
  format: ['esm'],
  target: 'node22',
  clean: true,
  splitting: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
})
