import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// Plain client-side Vite SPA.
// - TanStack Router file-based routing (client only, no SSR).
// - Builds static assets to `dist/`, which Vercel serves directly.
// - Backend logic lives in Vercel serverless functions under `/api`.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
  },
});
