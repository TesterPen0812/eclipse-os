import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// SPA fallback routes: paths that must serve index.html so client-side surface
// selection (App.tsx) can render. The browser URL is preserved; only the served
// document is rewritten to `/`.
//
//  - The legacy desktop path keeps the G3 parity primitive working against the
//    live app server (it points at the frozen static authority path) without
//    changing the scenario URL.
//  - The G12 settings paths (clean `/settings`, the file-style alias, and the
//    legacy static settings path) all resolve to the in-app settings surface.
const INDEX_FALLBACK_ROUTES = [
  "/components/eclipse-os/desktop-main/eclipse-os.html",
  "/settings",
  "/settings/eclipse-os-settings.html",
  "/components/eclipse-os/settings/eclipse-os-settings.html",
];

function indexFallbackRoutes(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url) {
      let path = req.url.split("?")[0];
      // Tolerate a single trailing slash (e.g. `/settings/`) except for root.
      if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
      if (INDEX_FALLBACK_ROUTES.includes(path)) {
        req.url = "/";
      }
    }
    next();
  };
  return {
    name: "eclipse-os-index-fallback-routes",
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}

export default defineConfig({
  plugins: [react(), indexFallbackRoutes()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
  },
});
