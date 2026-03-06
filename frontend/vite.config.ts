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
      // Map legacy \"colyseus.js\" import to the modern ESM client SDK.
      // @colyseus/sdk is compatible with Colyseus 0.16+ servers.
      "colyseus.js": "@colyseus/sdk"
    }
  }
});
