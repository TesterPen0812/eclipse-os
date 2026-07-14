// Eclipse OS desktop shell - G12 settings route matching.
//
// The desktop shell is a single-page app served at `/`. Settings is a second
// in-app surface reachable at a small set of paths. These are the canonical
// settings paths the Vite dev/preview SPA fallback rewrites to index.html (see
// vite.config.ts) and that App.tsx uses to decide which surface to render:
//
//   - /settings                                              (clean app route)
//   - /settings/eclipse-os-settings.html                     (file-style alias)
//   - /components/eclipse-os/settings/eclipse-os-settings.html (legacy static path)
//
// Trailing slashes are tolerated. Matching is path-only; query/hash are ignored.

const SETTINGS_PATHS = new Set([
  "/settings",
  "/settings/eclipse-os-settings.html",
  "/components/eclipse-os/settings/eclipse-os-settings.html",
]);

/** Normalize a pathname: strip a single trailing slash, except for root. */
function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/** True when the given pathname should render the settings surface. */
export function isSettingsRoute(pathname: string): boolean {
  return SETTINGS_PATHS.has(normalize(pathname));
}

/** The canonical in-app settings route used by the sidebar link. */
export const SETTINGS_ROUTE = "/settings";

/** The settings paths the Vite SPA fallback must serve index.html for. */
export const SETTINGS_ROUTE_PATHS: readonly string[] = Array.from(SETTINGS_PATHS);
