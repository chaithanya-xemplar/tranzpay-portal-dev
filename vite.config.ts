import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/router/index.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/types/**',
        'src/test/**',
        'src/assets/**',
        'src/components/Icon/index.ts',
        'src/design-system/index.ts',
        'src/services/axios.ts',
        'src/services/onboarding/mockAccounts.ts',
        'src/pages/users/userPermissions.api.types.ts',
      ],
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // in kB
  },
  // server: {
  //   host: '0.0.0.0',
  // }
})
