import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const appRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        index: `${appRoot}index.html`,
        eclipse: `${appRoot}EclipseOS.html`,
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
  },
});
