import { resolve } from "node:path";
import { defineConfig } from "vite";

// La raíz de la app web es `public/` (versión modular profesional).
// El monolítico antiguo vive en `backup/` y queda fuera del servidor.
export default defineConfig({
  root: "public",
  base: "./",
  server: {
    port: 3000,
    open: "/index.html",
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve("public/index.html"),
        admin: resolve("public/admin.html"),
      },
    },
  },
});
