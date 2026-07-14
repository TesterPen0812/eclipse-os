import { useEffect } from "react";

import { Shell } from "./components/Shell";
import { SettingsSurface } from "./components/SettingsSurface";
import { isSettingsRoute } from "./settings/settingsRoute";
import { initDesktopBehavior } from "./state/desktopBehavior";

/**
 * G9 behavior-extraction parity scaffold.
 *
 * Renders the frozen desktop static baseline with no intentional visual changes.
 * The previously monolithic markup is composed from extracted region components
 * under `components/` (Shell -> Sidebar, MainPane -> TopControls,
 * EnvironmentPanel, Transcript, Composer), with byte-exact inner HTML kept in
 * `fixtures/desktopShellMarkup.ts`. The ported behavior, once a single untyped
 * baseline script, now lives in typed modules under `state/` (composer,
 * conversation, envPanel, sidebar, ambient, rootChrome) plus the still-imperative
 * `state/moonRenderer`, orchestrated by `state/desktopBehavior`. DOM structure,
 * class names, ids, inline SVGs, timings, localStorage keys, and custom event
 * names are unchanged; the behavior is still bound imperatively against the
 * original ids.
 */
export function App() {
  // Path-based surface selection. The shell and the G12 settings surface are
  // mutually exclusive: settings paths render SettingsSurface, everything else
  // (including the legacy desktop path) renders the main Shell. The pathname is
  // read once at mount; navigation between the two surfaces is a full in-app page
  // load (plain same-origin links), so no client router is needed.
  const settings = isSettingsRoute(window.location.pathname);

  useEffect(() => {
    if (settings) return;
    // Bind the ported composer / sidebar / environment-panel behavior and start
    // the ASCII moon field once the baseline DOM (with its original ids) exists.
    // Skipped on the settings route, whose own extracted scripts drive it.
    initDesktopBehavior();
  }, [settings]);

  return settings ? <SettingsSurface /> : <Shell />;
}
