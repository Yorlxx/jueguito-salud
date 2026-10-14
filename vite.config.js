import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const repoRoot = dirname(fileURLToPath(import.meta.url));

// La raíz de la app web es `public/` (versión modular profesional).
// El monolítico antiguo vive en `backup/` y queda fuera del servidor.
export default defineConfig({
  root: "public",
  base: "./",
  // Los .env viven en la RAÍZ del repo (junto a este config), no en public/.
  envDir: repoRoot,
  server: {
    port: 3000,
    open: "/index.html",
    // Los túneles (trycloudflare.com) usan otro Host: permitirlos.
    allowedHosts: [".trycloudflare.com", "localhost", "127.0.0.1"],
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
