import { defineConfig } from "vite";

export default defineConfig({
  // Spike: the 3D table lab (/table-lab.html) uses React + R3F. esbuild's automatic
  // JSX runtime transpiles .tsx without @vitejs/plugin-react (which doesn't support
  // Vite 7 yet). The vanilla game pages have no JSX, so they are unaffected.
  esbuild: { jsx: "automatic" },
  server: {
    port: 5173
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    globals: true
  }
});
