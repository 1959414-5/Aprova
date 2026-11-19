import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages publica este repositório em /Aprova/.
  // Localmente e em outros hosts, a aplicação continua na raiz.
  base: process.env.GITHUB_ACTIONS ? "/Aprova/" : "/",
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
