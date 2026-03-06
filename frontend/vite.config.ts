import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
    globals: true
  }
});
