import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Build a self-contained Node server (works on Railway, Render, etc.)
  // instead of the default Cloudflare Workers output.
  nitro: { preset: "node-server" },
  tanstackStart: {
    // Pages render on the client; the Node server still serves the
    // HTML shell and the /api/* server routes.
    ssr: false,
  },
});
