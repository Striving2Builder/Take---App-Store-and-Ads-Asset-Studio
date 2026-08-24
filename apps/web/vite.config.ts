import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));
const svc = (name: string) =>
  fileURLToPath(new URL(`../../services/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  root,
  resolve: {
    alias: {
      "@take/core": pkg("core"),
      "@take/modes-sdk": pkg("modes-sdk"),
      "@take/device-catalog": pkg("device-catalog"),
      "@take/scan-client": pkg("scan-client"),
      "@take/storage": pkg("storage"),
      "@take/template-engine": pkg("template-engine"),
      "@take/export-presets": pkg("export-presets"),
      "@take/ad-unit-catalog": pkg("ad-unit-catalog"),
      "@take/ad-compliance": pkg("ad-compliance"),
      "@take/device-sync": svc("device-sync"),
    },
  },
  server: {
    port: 8765,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
