import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./inertia/tests/setup.ts'],
    include: ['inertia/tests/**/*.spec.tsx'],
  },
})
