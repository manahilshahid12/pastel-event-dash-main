import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Disable SSR for static hosting
    ssr: false,
  },
  build: {
    outDir: 'dist/client'
  }
});
