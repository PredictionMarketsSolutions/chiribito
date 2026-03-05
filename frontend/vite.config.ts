import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      // Force ESM build to avoid CJS resolution of ./errors/Errors.js (package ships .cjs/.mjs only)
      "colyseus.js": path.resolve(__dirname, "node_modules/@colyseus/sdk/build/index.mjs")
    }
  }
});
